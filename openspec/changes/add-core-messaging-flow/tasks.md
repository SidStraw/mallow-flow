# Tasks: 核心留言功能

## 1. Database Schema

- [x] 1.1 建立 `Viewers` 表基礎結構
  - `id` (UUID, PK)
  - `created_at` (Timestamp)
- [x] 1.2 建立 `Questions` 表
  - `id` (Serial, PK)
  - `project_id` (UUID, FK → Projects)
  - `viewer_id` (UUID, FK → Viewers, Nullable)
  - `display_name` (Text)
  - `content` (Text)
  - `status` (Text: 'pending' | 'visible' | 'hidden')
  - `is_hidden_by_streamer` (Boolean, default false)
  - `created_at` / `updated_at` (Timestamp)
- [x] 1.3 建立索引
  - `idx_questions_project_status` (project_id, status)
  - `idx_questions_created_at` (created_at DESC)
- [x] 1.4 執行 migration 並驗證 schema

## 2. 觀眾投稿 API

- [x] 2.1 建立 `POST /api/questions` endpoint
  - 驗證必填欄位 (project_id, content)
  - 驗證 content 長度 (10-500 字)
  - 產生匿名 display_name（若未提供）
  - 建立 Question 記錄，狀態為 'pending'
- [x] 2.2 實作 Rate Limiting
  - 每 IP 每分鐘最多 5 次投稿
  - 使用記憶體快取
- [x] 2.3 單元測試
  - 投稿驗證邏輯（長度、必填欄位）
  - Rate Limiting 行為

## 3. 直播主收件匣 API

- [x] 3.1 建立 `GET /api/inbox` endpoint
  - 驗證直播主身份（Session/JWT）
  - 查詢該直播主所有專案的留言
  - 支援篩選：status (all/pending/visible/hidden)
  - 實作 cursor-based pagination
- [x] 3.2 建立 `PUT /api/questions/:id/status` endpoint
  - 驗證直播主權限（只能操作自己專案的留言）
  - 允許狀態轉換：pending→visible, pending→hidden, visible→hidden
- [x] 3.3 建立 `DELETE /api/questions/:id` endpoint
  - 軟刪除：設定 `is_hidden_by_streamer = true` + `status = 'hidden'`
  - 驗證直播主權限
- [x] 3.4 單元測試
  - Rate Limiting 行為
  - Schema 驗證
  - Anonymous Name 生成

## 4. 觀眾投稿頁面

- [x] 4.1 建立 `/u/:slug` 頁面
  - 取得 slug 對應的專案（或直播主）
  - 若直播主有多個啟用中專案，顯示專案選擇器
- [x] 4.2 建立投稿表單元件
  - display_name 輸入（選填，預設匿名）
  - content 輸入（必填，10-500 字）
  - 字數即時顯示
  - 送出按鈕與載入狀態
- [x] 4.3 處理投稿成功/失敗
  - 成功：顯示確認訊息
  - 失敗：顯示錯誤訊息（Rate Limit、驗證失敗等）
- [x] 4.4 組件測試
  - 表單驗證行為
  - 成功/失敗狀態顯示

## 5. 直播主收件匣頁面

- [x] 5.1 建立 `/dashboard/inbox` 頁面
  - 使用原生 useFetch 管理 API 狀態
  - 實作手動重新整理按鈕
- [x] 5.2 建立留言列表元件
  - 留言卡片：顯示名稱、內容、時間、狀態
  - 分頁控制（載入更多按鈕）
- [x] 5.3 建立篩選功能
  - 篩選按鈕：全部、待處理、已顯示、已隱藏
  - 切換篩選時重新載入列表
- [x] 5.4 建立留言操作功能
  - 標記為已處理（pending → visible）
  - 隱藏留言（任何狀態 → hidden）
  - Optimistic UI：操作後立即更新介面，失敗時回滾
- [x] 5.5 組件測試
  - 留言列表渲染
  - 篩選切換
  - Optimistic UI 行為

## 6. E2E 測試

- [x] 6.1 測試流程：觀眾投稿 → 直播主收到留言
- [x] 6.2 測試流程：直播主操作留言（標記已處理、隱藏）
- [x] 6.3 測試 Rate Limiting 行為

## 7. 驗收

- [x] 7.1 TypeScript 型別檢查通過
- [x] 7.2 ESLint 檢查通過
- [x] 7.3 所有測試通過
- [x] 7.4 功能手動驗收
