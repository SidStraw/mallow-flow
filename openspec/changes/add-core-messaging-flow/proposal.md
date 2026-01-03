# Change: 核心留言功能

## Why

直播主需要收集觀眾留言並進行管理，此階段實作觀眾投稿與直播主收件匣的核心功能，為後續 AI 分析與付款功能奠定基礎。

## What Changes

- **新增 Database Schema**
  - `Questions` 表：儲存留言資料（包含專案歸屬、顯示名稱、內容、狀態等）
  - `Viewers` 表：預留觀眾資料結構（此階段僅建立基本欄位）
- **新增觀眾投稿功能**
  - 公開投稿頁面 `/u/:slug`
  - 匿名投稿表單（無需登入）
  - 字數限制 10-500 字
- **新增直播主收件匣**
  - 收件匣頁面 `/dashboard/inbox`
  - 留言列表（分頁、篩選）
  - 留言狀態管理（標記已處理、隱藏）
- **新增 API Endpoints**
  - `POST /api/questions` - 觀眾投稿
  - `GET /api/inbox` - 取得收件匣留言列表
  - `PUT /api/questions/:id/status` - 更新留言狀態
  - `DELETE /api/questions/:id` - 隱藏留言（軟刪除）

## Impact

- Affected specs: `messaging`（新建）
- Affected code:
  - `server/database/schema/` - Database Schema
  - `server/api/` - API Endpoints
  - `pages/u/[slug].vue` - 觀眾投稿頁面
  - `pages/dashboard/inbox.vue` - 直播主收件匣

## Dependencies

- 依賴 `setup-database-and-auth`（需先完成資料庫基礎架構與認證系統）

## Out of Scope

- 付款功能（Phase 3）
- AI 分析功能（Phase 4）
- WebSocket 即時通知（使用 Polling 替代）
- OBS Overlay 整合（後續 Phase）
