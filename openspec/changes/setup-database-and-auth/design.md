# Design: 基礎設施與直播主驗證系統

## Context

此為 Mallow Flow 專案的首個開發階段，需要建立完整的技術基礎設施。主要考量：

- **部署環境**: Cloudflare Pages + Workers，需確保 ORM 相容性
- **資料庫**: PostgreSQL (Zeabur Supabase)，未來需支援 pgvector
- **驗證**: Email Magic Link 優先，未來擴充 OAuth

## Goals / Non-Goals

### Goals

- 建立可在 Cloudflare Workers 正常運作的 Nuxt 4 專案
- 定義直播主與專案的資料庫 Schema
- 實作安全的 Magic Link 驗證流程
- 提供專案管理 CRUD API

### Non-Goals

- 不實作 OAuth 登入（Phase 2）
- 不實作會員等級驗證功能
- 不實作前端 UI 頁面（僅 API）
- 不實作點數系統運作邏輯

## Decisions

### 1. 資料庫連線策略

**決定**: 使用 Drizzle ORM + `postgres` driver (Cloudflare 相容)

**原因**:
- Drizzle 提供輕量、型別安全的 ORM
- `postgres` (porsager/postgres) 支援 Cloudflare Workers
- 避免 node:crypto 等 Node.js API 依賴

**替代方案**:
- Prisma: 不完全支援 Cloudflare Workers Edge Runtime
- Kysely: 功能較少，生態系不如 Drizzle

### 2. 資料庫連線池

**決定**: 使用 Hyperdrive 進行連線池管理

**原因**:
- Cloudflare 原生服務，零額外配置
- 自動處理連線池與連線重用
- 降低 PostgreSQL 連線開銷

**替代方案**:
- PgBouncer: 需自行部署與維護
- Supabase Pooler: 可作為備用方案

### 3. Magic Link 實作

**決定**: 使用 Nuxt Auth Utils + Resend 郵件服務

**原因**:
- Nuxt Auth Utils 提供完整的 Session 管理
- Resend 原生支援 Cloudflare Workers
- 簡化驗證流程，降低複雜度

**Token 機制**:
- Token 格式: JWT，包含 `email`、`exp` (15 分鐘有效期)
- 儲存: Token 不儲存資料庫，採用簽名驗證
- 安全: HTTPS-only、HttpOnly Cookie、SameSite=Strict

### 4. Session 管理

**決定**: Server-side Session + Secure Cookie

**原因**:
- 符合 Nuxt Auth Utils 預設行為
- Session 資料不暴露於前端
- 支援即時失效（登出時清除）

**Session 結構**:
```typescript
interface SessionData {
  streamerId: string
  email: string
  loginAt: number
}
```

### 5. 專案預設邏輯

**決定**: 首次登入自動建立預設專案

**原因**:
- 降低使用門檻，直播主無需手動建立
- 預設專案作為「未分類」容器
- 可重新命名但不可刪除

## Risks / Trade-offs

### 1. Cloudflare Workers CPU 限制

**風險**: 複雜查詢可能超過 50ms CPU 時間限制

**緩解**:
- Schema 設計避免複雜 JOIN
- 使用 Hyperdrive 減少連線開銷
- 監控 Worker 執行時間

### 2. Magic Link 郵件送達率

**風險**: 郵件可能被標記為垃圾郵件

**緩解**:
- 使用 Resend 的驗證域名功能
- 設定 SPF、DKIM、DMARC
- 提供「重新發送」功能

### 3. Token 安全性

**風險**: Magic Link 被攔截或轉發

**緩解**:
- Token 15 分鐘過期
- 單次使用（成功後失效）
- Rate Limiting 防止暴力破解

## Migration Plan

不適用（首次建立，無既有資料需遷移）

## Open Questions

1. ~~郵件服務商確認~~ → 決定使用 Resend
2. 是否需要在 Magic Link 登入後要求設定 slug？→ 建議 Phase 2 再實作
