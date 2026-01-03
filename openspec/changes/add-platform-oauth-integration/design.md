# Design: 直播平台 OAuth 整合

## Context

Mallow Flow 需要整合 YouTube 與 Twitch 兩個直播平台的 OAuth 驗證，以實作：
1. 直播主連接平台帳號，驗證頻道所有權
2. 觀眾驗證會員身份，解鎖會員專屬投稿功能

此設計涉及跨平台 API 整合、OAuth Token 管理、快取策略等技術決策。

### Stakeholders

- **直播主**: 連接平台帳號、設定會員限制
- **觀眾**: 驗證會員身份進行投稿
- **系統**: 管理 OAuth tokens、查詢會員等級

### Constraints

- Cloudflare Workers CPU 時間限制（50-100ms）
- YouTube API 每日 10,000 units 配額
- Twitch API 800 requests/min 限制
- 無 WebSocket，僅能使用 Polling

## Goals / Non-Goals

### Goals

- 支援 YouTube 與 Twitch 兩個平台的 OAuth 整合
- 實作安全的 OAuth token 儲存與管理
- 提供會員等級驗證功能
- 實作 API 快取機制以控制配額使用

### Non-Goals

- 本階段不支援其他直播平台（如 Facebook Gaming）
- 不實作 WebSocket 即時通知
- 不追蹤投稿後的會員等級變動

## Decisions

### Decision 1: OAuth Token 儲存策略

**選擇**: 使用 AES-256-GCM 加密後儲存於 `Streamers.platform_identity` JSONB 欄位

**原因**:
- 避免明文儲存敏感 tokens
- 統一在單一欄位管理多平台身份
- 利用 PostgreSQL JSONB 的查詢能力

**Alternatives considered**:
- 使用 Cloudflare Secrets：每次修改需重新部署，不適合動態 token
- 獨立 tokens 表：增加 JOIN 成本，且 tokens 與 streamer 是 1:1 關係

### Decision 2: 平台 Adapter Pattern

**選擇**: 建立 `PlatformAdapter` 抽象層，隔離平台差異

```typescript
// server/utils/platform-adapter.ts
interface PlatformAdapter {
  platform: 'youtube' | 'twitch';
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<TokenSet>;
  refreshToken(refreshToken: string): Promise<TokenSet>;
  getMembershipLevel(viewerId: string, channelId: string): Promise<number>;
}
```

**原因**:
- 統一 API 介面，簡化業務邏輯
- 便於未來新增其他平台
- 隔離平台 API 變更的影響

### Decision 3: 會員等級快取策略

**選擇**: 使用 Memory Cache（LRU）作為主要快取，TTL 5 分鐘

**原因**:
- Cloudflare Workers 單一 Worker 生命週期內有效
- 避免 Cloudflare KV 的寫入延遲（最多 60 秒）
- 5 分鐘 TTL 平衡配額控制與資料新鮮度

**Alternatives considered**:
- Cloudflare KV：寫入有延遲，且需額外費用
- Redis (Upstash)：增加外部依賴，增加延遲
- 不快取：可能超出 YouTube API 配額

**實作細節**:
```typescript
// server/utils/membership-cache.ts
const cache = new Map<string, { level: number; expiredAt: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedMembership(key: string): number | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiredAt) return null;
  return entry.level;
}
```

### Decision 4: OAuth State 驗證

**選擇**: 使用加密簽名的 JWT 作為 OAuth state 參數

**原因**:
- 防止 CSRF 攻擊
- 可攜帶 callback 所需資訊（redirect_uri, user_id）
- 設定短期過期時間（10 分鐘）

**State payload**:
```typescript
interface OAuthState {
  iss: 'mallow-flow';
  sub: string;       // streamer_id or 'viewer'
  platform: 'youtube' | 'twitch';
  redirect: string;  // 成功後重導向 URL
  exp: number;       // 10 分鐘後過期
}
```

### Decision 5: 觀眾 OAuth 流程（Sessionless）

**選擇**: 觀眾 OAuth 完成後發放一次性 verification token

**流程**:
1. 觀眾點擊「驗證會員身份」→ 重導向至平台 OAuth
2. 平台授權後回調 → 系統查詢會員等級
3. 發放 verification token（含 member_tier，10 分鐘有效）
4. 前端攜帶 token 進行投稿 → 後端驗證並記錄

**原因**:
- 避免為每位觀眾建立 session（stateless）
- 一次性 token 降低 token 外洩風險
- 會員等級在投稿時確認，不需持續追蹤

## Risks / Trade-offs

### Risk 1: YouTube API 配額耗盡

**風險**: Membership API 查詢成本高，可能快速耗盡每日 10,000 units

**Mitigation**:
- 實作 5 分鐘快取
- 監控每日使用量，接近上限時發出警告
- 考慮批次查詢優化

### Risk 2: OAuth Token 外洩

**風險**: 若 tokens 外洩，攻擊者可存取直播主頻道資訊

**Mitigation**:
- AES-256-GCM 加密儲存
- 加密金鑰使用 Cloudflare Secrets 管理
- 實作 token 撤銷機制（取消連接時）

### Risk 3: 會員等級過時

**風險**: 觀眾在投稿後取消訂閱，但留言仍顯示會員徽章

**Mitigation**:
- 設計決策：記錄投稿當下的會員等級，不追蹤後續變動
- 在 UI 明確標示「投稿時會員等級」
- 此為有意的產品決策，降低系統複雜度

### Risk 4: 平台 API 變更

**風險**: YouTube/Twitch 可能變更 API 格式或廢除端點

**Mitigation**:
- Adapter Pattern 隔離平台差異
- 監控 API 錯誤率
- 訂閱平台開發者更新通知

## Migration Plan

此為新功能，無需遷移現有資料。

### Rollback Strategy

1. 停用 OAuth 相關 API endpoints
2. 保留 `platform_identity` 資料（加密狀態）
3. 還原 `Questions` 查詢邏輯（忽略 member_tier）
4. 觀眾投稿恢復純匿名模式

## Open Questions

1. **Q: 是否需要支援 YouTube 頻道會員以外的「超級感謝」驗證？**
   - 目前僅支援頻道會員，超級感謝為一次性贊助，暫不納入

2. **Q: 觀眾 OAuth 是否需要持久化？**
   - 決策：不持久化。觀眾每次投稿時重新驗證，避免 session 管理複雜度

3. **Q: 快取是否需要跨 Worker 實例共享？**
   - 決策：暫不需要。單一 Worker 實例的 Memory Cache 已足夠，未來可升級至 Cloudflare KV
