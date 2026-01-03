# Phase 2: 核心留言功能提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`add-core-messaging-flow`

## 目標

實作觀眾投稿與直播主收件匣核心功能，此階段不包含付款與 AI 分析。

### 具體交付項目

1. **資料庫 Schema 擴充**
   - `Questions` 表：留言資料
     - `id` (Serial, PK)
     - `project_id` (UUID, FK) - 歸屬專案
     - `viewer_id` (UUID, FK, Nullable) - 可為空，關聯至 Viewers 表
     - `display_name` (Text) - 顯示名稱（匿名時為隨機暱稱）
     - `content` (Text) - 留言內容
     - `status` (Text) - 'pending', 'visible', 'hidden'
     - `is_hidden_by_streamer` (Boolean) - 是否被直播主移除
     - `created_at` (Timestamp)
     - `updated_at` (Timestamp)
   - `Viewers` 表（預留，此階段不實作詳細欄位）
     - `id` (UUID, PK)
     - `created_at` (Timestamp)

2. **觀眾投稿功能**
   - 公開投稿頁面 `/u/:slug`
   - 匿名投稿表單（無需登入）
   - 字數限制：10-500 字
   - 投稿成功後顯示確認訊息
   - 專案選擇（若直播主有多個啟用中的專案）

3. **直播主收件匣**
   - 收件匣頁面 `/dashboard/inbox`
   - 留言列表（支援分頁）
   - 篩選功能：全部、待處理、已顯示、已隱藏
   - 操作功能：標記為已處理、隱藏留言
   - Optimistic UI：操作後立即更新介面

4. **API Endpoints**
   - `POST /api/questions` - 觀眾投稿
   - `GET /api/inbox` - 取得收件匣留言列表
   - `PUT /api/questions/:id/status` - 更新留言狀態
   - `DELETE /api/questions/:id` - 隱藏留言（軟刪除）

## 技術規範

### 前端元件

- 使用 Nuxt UI 元件庫
- TanStack Query 管理 API 狀態
- Optimistic UI 實作（操作時立即更新 UI，失敗時回滾）

### 後端邏輯

- 驗證投稿內容（長度、基本格式）
- 驗證直播主權限（只能操作自己的留言）
- 防止重複投稿（同一 IP 在短時間內限制投稿次數）

### 狀態管理

- 留言狀態流程：
  ```
  pending → visible（顯示在 OBS）
  pending → hidden（直接隱藏）
  visible → hidden（從 OBS 移除）
  ```

## 依賴

- `setup-database-and-auth`（需先完成）

## 驗收標準

### 功能驗收

- [ ] 觀眾可在 `/u/:slug` 頁面投稿
- [ ] 投稿成功後顯示確認訊息
- [ ] 直播主登入後可看到收件匣
- [ ] 收件匣支援篩選與分頁
- [ ] 可以隱藏留言並更新狀態
- [ ] Optimistic UI 正常運作

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] 單元測試覆蓋核心邏輯
- [ ] E2E 測試涵蓋完整流程

## 風險與注意事項

1. **防濫用機制**
   - 需實作 Rate Limiting（每 IP 每分鐘投稿次數限制）
   - 考慮使用 Cloudflare Turnstile 驗證（可選）

2. **即時性考量**
   - 此階段不使用 WebSocket
   - 收件匣使用 Polling（10-30 秒間隔）或手動重新整理

3. **效能考量**
   - 留言列表需加上索引（project_id, status, created_at）
   - 分頁使用 cursor-based pagination 避免效能問題

## 上下文參考

### 架構模式（來自 project.md）

- Optimistic UI：直播主後台操作（移除/投放）立即更新介面狀態
- 無 WebSocket：Serverless 環境不使用長連線，改用 Polling

### 測試策略

- 單元測試 (Vitest)：測試投稿驗證、狀態轉換邏輯
- 組件測試 (Testing Library)：測試投稿表單、留言卡片渲染
- E2E 測試 (Playwright)：觀眾投稿 → 直播主收件匣看到留言 → 操作留言

---

請產生 `proposal.md`、`tasks.md` 和 `spec.deltas.md`，建立 `messaging` capability 的 specs。
