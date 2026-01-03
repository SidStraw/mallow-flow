## ADDED Requirements

### Requirement: 直播主平台連接

直播主 SHALL 能夠連接 YouTube 或 Twitch 帳號以驗證頻道所有權。系統 SHALL 使用 OAuth 2.0 進行平台授權，並安全儲存 access token 與 refresh token。

#### Scenario: 成功連接 YouTube 帳號

- **WHEN** 直播主點擊「連接 YouTube」按鈕
- **AND** 完成 Google OAuth 授權流程
- **AND** 授權成功
- **THEN** 系統儲存 YouTube tokens 至 `platform_identity`
- **AND** 設定頁面顯示已連接 YouTube 帳號
- **AND** 顯示連接成功通知

#### Scenario: 成功連接 Twitch 帳號

- **WHEN** 直播主點擊「連接 Twitch」按鈕
- **AND** 完成 Twitch OAuth 授權流程
- **AND** 授權成功
- **THEN** 系統儲存 Twitch tokens 至 `platform_identity`
- **AND** 設定頁面顯示已連接 Twitch 帳號
- **AND** 顯示連接成功通知

#### Scenario: OAuth 授權失敗

- **WHEN** 直播主在 OAuth 流程中拒絕授權
- **OR** OAuth 回調發生錯誤
- **THEN** 系統重導向至設定頁面
- **AND** 顯示連接失敗的錯誤訊息

#### Scenario: 取消平台連接

- **WHEN** 直播主點擊已連接平台的「取消連接」按鈕
- **AND** 確認取消連接
- **THEN** 系統清除該平台的 tokens
- **AND** 設定頁面不再顯示該平台連接狀態
- **AND** 若該直播主有啟用會員限制功能，系統停用會員限制

### Requirement: OAuth Token 安全管理

系統 SHALL 使用 AES-256-GCM 加密 OAuth tokens 後儲存，並 SHALL 在 token 過期前自動 refresh。

#### Scenario: Token 自動更新

- **GIVEN** 直播主已連接平台帳號
- **WHEN** Access Token 即將過期（剩餘 5 分鐘內）
- **AND** 系統需要存取平台 API
- **THEN** 系統使用 Refresh Token 取得新的 Access Token
- **AND** 更新儲存的加密 tokens

#### Scenario: Refresh Token 失效

- **GIVEN** 直播主已連接平台帳號
- **WHEN** Refresh Token 已失效（例如：使用者在平台端撤銷授權）
- **AND** 系統嘗試 refresh tokens
- **THEN** refresh 失敗
- **AND** 系統標記該平台連接為「需重新連接」
- **AND** 通知直播主重新連接平台帳號

### Requirement: 觀眾會員驗證

觀眾 SHALL 能夠在投稿時驗證其 YouTube/Twitch 會員身份。系統 SHALL 查詢平台 API 取得會員等級並記錄於投稿中。

#### Scenario: YouTube 會員驗證成功

- **GIVEN** 直播主已連接 YouTube 帳號
- **WHEN** 觀眾點擊「驗證會員身份」
- **AND** 完成 Google OAuth 授權
- **AND** 觀眾是該頻道的會員
- **THEN** 系統取得觀眾的會員等級（以 levelId 對應）
- **AND** 投稿時記錄 `member_tier` 和 `member_tier_metadata`
- **AND** 發放 verification token 給觀眾

#### Scenario: Twitch 訂閱者驗證成功

- **GIVEN** 直播主已連接 Twitch 帳號
- **WHEN** 觀眾點擊「驗證會員身份」
- **AND** 完成 Twitch OAuth 授權
- **AND** 觀眾是該頻道的訂閱者
- **THEN** 系統取得觀眾的訂閱等級（Tier 1/2/3）
- **AND** 投稿時記錄 `member_tier`（1/2/3 對應 Tier 1/2/3）
- **AND** 發放 verification token 給觀眾

#### Scenario: 會員驗證失敗（非會員）

- **GIVEN** 直播主已連接平台帳號
- **WHEN** 觀眾完成 OAuth 授權
- **AND** 觀眾不是該頻道的會員/訂閱者
- **THEN** 系統記錄 `member_tier = 0`
- **AND** 告知觀眾目前非會員身份
- **AND** 若專案允許匿名投稿，觀眾仍可繼續投稿

### Requirement: 會員限制投稿

直播主 SHALL 能夠設定專案的最低會員等級要求。未達標準的觀眾 SHALL 無法在該專案投稿（除非啟用匿名投稿）。

#### Scenario: 設定會員等級限制

- **GIVEN** 直播主已連接至少一個平台帳號
- **WHEN** 直播主在專案設定中選擇「最低會員等級」
- **THEN** 系統儲存 `min_member_tier` 設定
- **AND** 該專案投稿頁面顯示會員限制提示

#### Scenario: 會員等級不足被拒絕

- **GIVEN** 專案設定了最低會員等級（例如：Tier 2）
- **WHEN** 觀眾驗證會員身份
- **AND** 觀眾會員等級低於要求（例如：Tier 1）
- **THEN** 系統顯示「會員等級不足」提示
- **AND** 禁止該觀眾投稿
- **AND** 提示觀眾升級會員等級

#### Scenario: 會員等級達標可投稿

- **GIVEN** 專案設定了最低會員等級（例如：Tier 2）
- **WHEN** 觀眾驗證會員身份
- **AND** 觀眾會員等級達到或超過要求（例如：Tier 2 或 Tier 3）
- **THEN** 觀眾可以繼續投稿流程

#### Scenario: 未連接平台無法啟用會員限制

- **GIVEN** 直播主尚未連接任何平台帳號
- **WHEN** 直播主嘗試設定會員等級限制
- **THEN** 系統顯示提示「請先連接 YouTube 或 Twitch 帳號」
- **AND** 無法啟用會員限制功能

### Requirement: 會員等級 API 快取

系統 SHALL 快取會員等級查詢結果，TTL 為 5 分鐘，以控制平台 API 配額使用。

#### Scenario: 快取命中

- **GIVEN** 觀眾 A 在 3 分鐘前已驗證會員身份
- **WHEN** 觀眾 A 再次嘗試投稿並驗證身份
- **THEN** 系統從快取取得會員等級
- **AND** 不呼叫平台 API

#### Scenario: 快取過期

- **GIVEN** 觀眾 A 在 6 分鐘前已驗證會員身份
- **WHEN** 觀眾 A 再次嘗試投稿並驗證身份
- **THEN** 快取已過期
- **AND** 系統呼叫平台 API 重新查詢會員等級
- **AND** 更新快取

### Requirement: 留言卡片會員顯示

留言卡片 SHALL 顯示觀眾的會員等級徽章（若有驗證）。

#### Scenario: 顯示會員徽章

- **GIVEN** 觀眾投稿時已驗證會員身份
- **AND** 會員等級為 Tier 2
- **WHEN** 直播主查看收件匣
- **THEN** 該留言卡片顯示「Tier 2」會員徽章

#### Scenario: 匿名投稿不顯示徽章

- **GIVEN** 觀眾以匿名方式投稿
- **WHEN** 直播主查看收件匣
- **THEN** 該留言卡片不顯示會員徽章

### Requirement: OAuth API Endpoints

系統 SHALL 提供以下 API endpoints 處理 OAuth 流程。

#### Scenario: 開始 YouTube OAuth

- **WHEN** 呼叫 `GET /api/oauth/youtube/connect`
- **THEN** 回應 302 重導向至 Google OAuth 授權頁面
- **AND** URL 包含正確的 scopes 和 state 參數

#### Scenario: YouTube OAuth 回調

- **WHEN** 呼叫 `GET /api/oauth/youtube/callback` 並帶有授權碼
- **AND** state 參數驗證成功
- **THEN** 系統交換 authorization code 取得 tokens
- **AND** 儲存加密後的 tokens
- **AND** 重導向至設定頁面

#### Scenario: 開始 Twitch OAuth

- **WHEN** 呼叫 `GET /api/oauth/twitch/connect`
- **THEN** 回應 302 重導向至 Twitch OAuth 授權頁面
- **AND** URL 包含正確的 scopes 和 state 參數

#### Scenario: Twitch OAuth 回調

- **WHEN** 呼叫 `GET /api/oauth/twitch/callback` 並帶有授權碼
- **AND** state 參數驗證成功
- **THEN** 系統交換 authorization code 取得 tokens
- **AND** 儲存加密後的 tokens
- **AND** 重導向至設定頁面

#### Scenario: 驗證觀眾會員等級

- **WHEN** 呼叫 `POST /api/viewer/verify-membership` 並帶有 verification token
- **THEN** 系統驗證 token 有效性
- **AND** 回應會員等級資訊

#### Scenario: 取消平台連接

- **WHEN** 呼叫 `DELETE /api/oauth/:platform/disconnect`
- **AND** 使用者已登入
- **THEN** 系統清除該平台的 tokens
- **AND** 回應 200 OK

### Requirement: 資料庫 Schema 擴充

系統 SHALL 擴充資料庫 schema 以支援平台整合功能。

#### Scenario: Streamers.platform_identity 結構

- **GIVEN** 直播主已連接 YouTube 和 Twitch
- **WHEN** 查詢 `platform_identity` 欄位
- **THEN** 回傳 JSONB 包含：
  ```json
  {
    "youtube": {
      "channelId": "UC...",
      "accessToken": "[encrypted]",
      "refreshToken": "[encrypted]",
      "expiresAt": "2024-01-01T12:00:00Z"
    },
    "twitch": {
      "broadcasterId": "12345",
      "accessToken": "[encrypted]",
      "refreshToken": "[encrypted]",
      "expiresAt": "2024-01-01T12:00:00Z"
    }
  }
  ```

#### Scenario: Viewers 表擴充欄位

- **GIVEN** 觀眾透過 YouTube OAuth 驗證
- **WHEN** 系統記錄觀眾資訊
- **THEN** `Viewers` 表記錄：
  - `platform_id`: YouTube User ID
  - `platform_type`: 'youtube'
  - `display_name`: 平台顯示名稱

#### Scenario: Questions 表會員欄位

- **GIVEN** 觀眾投稿時已驗證 Tier 2 會員
- **WHEN** 系統建立 Question 記錄
- **THEN** `Questions` 表記錄：
  - `member_tier`: 2
  - `member_tier_metadata`: `{"platform": "twitch", "tierName": "Tier 2"}`
