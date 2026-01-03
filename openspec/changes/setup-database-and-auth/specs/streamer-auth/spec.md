## ADDED Requirements

### Requirement: Magic Link 登入

系統 **SHALL** 支援透過 Email Magic Link 進行直播主身份驗證。

#### Scenario: 發送 Magic Link

- **GIVEN** 使用者提供有效的電子郵件地址
- **WHEN** 使用者請求登入
- **THEN** 系統 **SHALL** 發送包含驗證連結的郵件至該地址
- **AND** 驗證連結 **SHALL** 在 15 分鐘後失效

#### Scenario: 新使用者首次登入

- **GIVEN** 電子郵件地址不存在於系統中
- **WHEN** 使用者透過 Magic Link 完成驗證
- **THEN** 系統 **SHALL** 自動建立新的直播主帳號
- **AND** 系統 **SHALL** 建立預設專案

#### Scenario: 既有使用者登入

- **GIVEN** 電子郵件地址已存在於系統中
- **WHEN** 使用者透過 Magic Link 完成驗證
- **THEN** 系統 **SHALL** 建立新的 Session
- **AND** 系統 **SHALL NOT** 建立新的直播主帳號

#### Scenario: Magic Link 過期

- **GIVEN** Magic Link 已超過 15 分鐘
- **WHEN** 使用者嘗試使用該連結
- **THEN** 系統 **SHALL** 回傳 401 Unauthorized
- **AND** 系統 **SHALL** 顯示「驗證連結已過期，請重新申請」訊息

#### Scenario: Magic Link 重複使用

- **GIVEN** Magic Link 已被使用過
- **WHEN** 使用者嘗試再次使用該連結
- **THEN** 系統 **SHALL** 回傳 401 Unauthorized
- **AND** 系統 **SHALL** 顯示「驗證連結已使用，請重新申請」訊息

### Requirement: Session 管理

系統 **SHALL** 使用 Server-side Session 管理已驗證的使用者狀態。

#### Scenario: Session 建立

- **WHEN** 使用者成功通過 Magic Link 驗證
- **THEN** 系統 **SHALL** 建立包含 `streamerId`、`email`、`loginAt` 的 Session
- **AND** 系統 **SHALL** 設定 HttpOnly、Secure、SameSite=Strict 的 Cookie

#### Scenario: Session 驗證

- **GIVEN** 使用者持有有效的 Session Cookie
- **WHEN** 使用者存取受保護的 API
- **THEN** 系統 **SHALL** 允許存取

#### Scenario: Session 失效

- **GIVEN** 使用者的 Session Cookie 不存在或無效
- **WHEN** 使用者存取受保護的 API
- **THEN** 系統 **SHALL** 回傳 401 Unauthorized

### Requirement: 登出功能

系統 **SHALL** 提供登出功能以清除使用者 Session。

#### Scenario: 成功登出

- **GIVEN** 使用者已登入
- **WHEN** 使用者請求登出
- **THEN** 系統 **SHALL** 清除 Server-side Session
- **AND** 系統 **SHALL** 清除 Session Cookie
- **AND** 系統 **SHALL** 回傳 200 OK

### Requirement: 取得當前使用者

系統 **SHALL** 提供 API 以取得當前登入使用者的資訊。

#### Scenario: 已登入狀態

- **GIVEN** 使用者已登入
- **WHEN** 使用者請求取得當前使用者資訊
- **THEN** 系統 **SHALL** 回傳直播主資料（id、email、slug、active_tier）

#### Scenario: 未登入狀態

- **GIVEN** 使用者未登入
- **WHEN** 使用者請求取得當前使用者資訊
- **THEN** 系統 **SHALL** 回傳 401 Unauthorized
