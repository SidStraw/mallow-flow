## ADDED Requirements

### Requirement: 列出專案

系統 **SHALL** 提供 API 以列出直播主擁有的所有專案。

#### Scenario: 成功列出專案

- **GIVEN** 直播主已登入
- **WHEN** 直播主請求列出專案
- **THEN** 系統 **SHALL** 回傳該直播主的所有專案（不含已軟刪除）
- **AND** 回傳資料 **SHALL** 包含 `id`、`name`、`is_default`、`is_active`、`created_at`

#### Scenario: 未登入狀態

- **GIVEN** 使用者未登入
- **WHEN** 使用者請求列出專案
- **THEN** 系統 **SHALL** 回傳 401 Unauthorized

### Requirement: 建立專案

系統 **SHALL** 提供 API 以建立新專案。

#### Scenario: 成功建立專案

- **GIVEN** 直播主已登入
- **WHEN** 直播主提供有效的專案名稱
- **THEN** 系統 **SHALL** 建立新專案
- **AND** 新專案的 `is_default` **SHALL** 為 false
- **AND** 新專案的 `is_active` **SHALL** 為 true

#### Scenario: 專案名稱驗證

- **GIVEN** 直播主已登入
- **WHEN** 直播主提供空白或超過 100 字元的專案名稱
- **THEN** 系統 **SHALL** 回傳 400 Bad Request
- **AND** 系統 **SHALL** 顯示驗證錯誤訊息

### Requirement: 更新專案

系統 **SHALL** 提供 API 以更新專案資訊。

#### Scenario: 成功更新專案

- **GIVEN** 直播主已登入且擁有該專案
- **WHEN** 直播主提供有效的更新資料
- **THEN** 系統 **SHALL** 更新專案資訊
- **AND** 系統 **SHALL** 更新 `updated_at` 時間戳記

#### Scenario: 更新他人專案

- **GIVEN** 直播主已登入但不擁有該專案
- **WHEN** 直播主嘗試更新該專案
- **THEN** 系統 **SHALL** 回傳 403 Forbidden

#### Scenario: 更新不存在的專案

- **GIVEN** 直播主已登入
- **WHEN** 直播主嘗試更新不存在的專案
- **THEN** 系統 **SHALL** 回傳 404 Not Found

### Requirement: 刪除專案

系統 **SHALL** 提供 API 以刪除專案。

#### Scenario: 刪除無留言的專案

- **GIVEN** 直播主已登入且擁有該專案
- **AND** 專案沒有任何關聯留言
- **WHEN** 直播主請求刪除該專案
- **THEN** 系統 **SHALL** 實際刪除該專案記錄

#### Scenario: 刪除有留言的專案

- **GIVEN** 直播主已登入且擁有該專案
- **AND** 專案有關聯留言
- **WHEN** 直播主請求刪除該專案
- **THEN** 系統 **SHALL** 執行軟刪除（設定 `deleted_at`）
- **AND** 系統 **SHALL NOT** 實際刪除資料

#### Scenario: 刪除預設專案

- **GIVEN** 直播主已登入且擁有該專案
- **AND** 專案為預設專案（`is_default = true`）
- **WHEN** 直播主請求刪除該專案
- **THEN** 系統 **SHALL** 回傳 400 Bad Request
- **AND** 系統 **SHALL** 顯示「無法刪除預設專案」訊息

#### Scenario: 刪除他人專案

- **GIVEN** 直播主已登入但不擁有該專案
- **WHEN** 直播主嘗試刪除該專案
- **THEN** 系統 **SHALL** 回傳 403 Forbidden

### Requirement: 預設專案

系統 **SHALL** 確保每位直播主至少有一個預設專案。

#### Scenario: 首次登入建立預設專案

- **GIVEN** 直播主首次登入
- **WHEN** 帳號建立成功
- **THEN** 系統 **SHALL** 自動建立名為「預設企劃」的專案
- **AND** 該專案的 `is_default` **SHALL** 為 true
- **AND** 該專案的 `is_active` **SHALL** 為 true

#### Scenario: 預設專案唯一性

- **GIVEN** 直播主已有預設專案
- **WHEN** 嘗試將另一個專案設為預設
- **THEN** 系統 **SHALL** 將原預設專案的 `is_default` 設為 false
- **AND** 系統 **SHALL** 將新專案的 `is_default` 設為 true
