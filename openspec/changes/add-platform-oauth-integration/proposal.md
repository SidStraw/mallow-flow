# Change: 新增直播平台 OAuth 整合

## Why

目前直播主只能透過 Email Magic Link 登入，無法驗證其 YouTube/Twitch 頻道所有權。觀眾投稿時也無法驗證會員身份，導致無法實作會員專屬投稿功能。此變更將整合 YouTube 與 Twitch OAuth，讓直播主連接平台帳號並啟用會員限制功能，同時讓觀眾透過 OAuth 驗證會員等級。

## What Changes

### 資料庫 Schema

- **MODIFIED** `Streamers.platform_identity` JSONB 結構擴充，支援 YouTube/Twitch OAuth tokens
- **ADDED** `Viewers` 表擴充 `platform_id`、`platform_type`、`display_name` 欄位
- **ADDED** `Questions` 表擴充 `member_tier`、`member_tier_metadata` 欄位

### 直播主平台連接

- **ADDED** YouTube OAuth 連接流程（頻道擁有者驗證）
- **ADDED** Twitch OAuth 連接流程（頻道擁有者驗證）
- **ADDED** 設定頁面顯示已連接平台
- **ADDED** 平台取消連接功能

### 觀眾會員驗證

- **ADDED** 觀眾投稿時可選擇驗證會員身份
- **ADDED** YouTube 會員驗證 flow
- **ADDED** Twitch 訂閱者驗證 flow
- **ADDED** 會員等級顯示在留言卡片

### 會員限制投稿

- **ADDED** 直播主可設定最低會員等級要求
- **ADDED** 未達標準時顯示提示訊息
- **ADDED** 允許同時匿名投稿選項

### API 快取

- **ADDED** 會員等級查詢快取機制（5 分鐘 TTL）

## Impact

- **Affected specs**: `platform-integration` (新建)
- **Affected code**:
  - `server/database/schema.ts` (Schema 擴充)
  - `server/api/oauth/` (OAuth endpoints)
  - `server/api/viewer/` (會員驗證 API)
  - `pages/dashboard/settings/` (設定頁面)
  - `components/question/` (留言卡片會員顯示)

## Dependencies

- `add-core-messaging-flow`：需先有基本投稿功能與 `Questions` 表

## Breaking Changes

無。此為純新增功能，現有匿名投稿流程不受影響。
