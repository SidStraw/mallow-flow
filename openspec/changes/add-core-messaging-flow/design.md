# Design: 核心留言功能

## Context

此變更為 Mallow Flow 平台的第二階段，實作觀眾投稿與直播主收件匣核心功能。此階段不包含付款與 AI 分析，專注於建立穩固的留言資料流。

### 利害關係人

- **觀眾**：希望能快速、匿名地投稿留言
- **直播主**：希望能有效率地管理大量留言

### 限制條件

- Serverless 環境（Cloudflare Workers）：無 WebSocket 支援
- 需考量防濫用機制（Rate Limiting）
- 需為後續付款、AI 分析功能預留擴充空間

## Goals / Non-Goals

### Goals

- 提供簡單易用的觀眾投稿介面
- 提供直播主高效的留言管理收件匣
- 實作 Optimistic UI 提升操作體驗
- 建立可擴充的資料模型

### Non-Goals

- 即時推播（此階段使用 Polling）
- 付款功能
- AI 分析功能
- OBS Overlay 整合

## Decisions

### 1. 留言狀態機設計

**Decision**: 採用三狀態設計 (`pending`, `visible`, `hidden`)

```
投稿 → pending
       ↓
  直播主操作
       ↓
  visible ←→ hidden
```

**Rationale**:
- `pending`：新投稿預設狀態，等待直播主處理
- `visible`：已標記為可顯示（未來供 OBS Overlay 使用）
- `hidden`：已隱藏，不顯示於 OBS

**Alternatives considered**:
- 四狀態（新增 `archived`）：過於複雜，此階段不需要
- 布林欄位組合：難以擴充，不利於未來狀態新增

### 2. 分頁策略

**Decision**: 使用 Cursor-based Pagination

**Rationale**:
- 避免深度分頁效能問題
- 支援即時新增資料的一致性
- 符合 `project.md` 效能考量

**Implementation**:
- Cursor 使用 `created_at` + `id` 組合
- 每頁預設 20 筆，最大 100 筆

### 3. Rate Limiting 策略

**Decision**: 每 IP 每分鐘最多 5 次投稿

**Rationale**:
- 平衡用戶體驗與防濫用需求
- 簡單實作，可在 Cloudflare Workers 執行

**Implementation options**:
1. Cloudflare Workers KV（推薦）
2. 記憶體快取（限單一 Worker Instance）
3. PostgreSQL（增加 DB 負擔，不建議）

### 4. 匿名暱稱生成

**Decision**: 使用形容詞 + 動物名稱組合（如「快樂的企鵝」）

**Rationale**:
- 友善、易記
- 避免重複性高的隨機字串
- 可在前端或後端生成

### 5. Optimistic UI 實作

**Decision**: 使用 TanStack Query 的 `useMutation` 搭配 `onMutate` / `onError` / `onSettled`

**Rationale**:
- 符合專案既有技術選型
- 內建 rollback 機制
- 與 Query Invalidation 整合良好

## Risks / Trade-offs

### Risk 1: Rate Limiting 被繞過

- **風險**：使用者透過 VPN/Proxy 繞過 IP 限制
- **Mitigation**: 未來可整合 Cloudflare Turnstile（Bot 驗證）
- **Acceptance**: 此階段接受基本 IP 限制，後續迭代強化

### Risk 2: Polling 造成 API 負載

- **風險**：多位直播主同時開啟收件匣，大量 Polling 請求
- **Mitigation**:
  - 較長 Polling 間隔（30 秒）
  - 提供手動重新整理按鈕
  - 後端加上適當快取

### Risk 3: 狀態不一致

- **風險**：Optimistic UI 更新後，實際 API 失敗導致不一致
- **Mitigation**: TanStack Query 內建 rollback，失敗時自動回復

## Migration Plan

### Database Migration

1. 建立 `Viewers` 表（基礎結構）
2. 建立 `Questions` 表
3. 建立必要索引
4. 驗證 migration 成功

### Rollback Plan

- 如需 rollback，執行反向 migration 刪除表格
- 此階段無既有資料，rollback 風險低

## Open Questions

1. **專案選擇 UX**：若直播主有多個專案，觀眾投稿頁面如何選擇？
   - Option A: 下拉選單
   - Option B: 分頁顯示各專案
   - **建議**: 先採用下拉選單，簡單直覺

2. **匿名暱稱在地化**：是否需要支援多語言暱稱？
   - 此階段先使用中文暱稱，後續再評估多語言需求
