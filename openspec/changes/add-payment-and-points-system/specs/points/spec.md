## ADDED Requirements

### Requirement: Points Accumulation

系統 **SHALL** 在付款成功後為直播主累積點數，1 TWD = 1 Point。

#### Scenario: 付款成功後點數增加

- **GIVEN** 觀眾完成 100 TWD 付款
- **WHEN** 付款狀態更新為 `completed`
- **THEN** 直播主 `points_balance` 增加 100
- **AND** 建立點數變動日誌記錄

#### Scenario: 點數變動日誌記錄

- **GIVEN** 任何點數變動發生
- **WHEN** 點數餘額更新
- **THEN** 系統記錄 `balance_before`、`balance_after`、`reason`、`reference_id`
- **AND** 記錄 `warn` level 日誌

### Requirement: Points Deduction

系統 **SHALL** 在退款時從直播主帳戶扣除對應點數。

#### Scenario: 退款後點數扣除

- **GIVEN** 直播主目前有 500 點
- **WHEN** 100 TWD 的留言被退款
- **THEN** 直播主 `points_balance` 減少至 400
- **AND** 建立點數變動日誌記錄

#### Scenario: 點數餘額不足時扣除

- **GIVEN** 直播主目前有 50 點
- **WHEN** 100 TWD 的留言被退款
- **THEN** 直播主 `points_balance` 變為 -50（允許負數）
- **AND** 建立點數變動日誌記錄
- **AND** 記錄 `warn` level 日誌標註餘額不足

### Requirement: Points Transaction Safety

系統 **SHALL** 使用 Database Transaction 確保點數變動的資料一致性。

#### Scenario: 並發點數變動

- **GIVEN** 同一直播主同時有多筆點數變動請求
- **WHEN** 使用 `SELECT FOR UPDATE` 鎖定記錄
- **THEN** 所有變動按順序執行
- **AND** 最終餘額正確無誤

#### Scenario: Transaction 失敗回滾

- **GIVEN** 點數變動 Transaction 執行中
- **WHEN** 任一步驟失敗（更新餘額或記錄日誌）
- **THEN** 整個 Transaction 回滾
- **AND** 點數餘額保持原狀

### Requirement: Points Balance Query

系統 **SHALL** 提供 API 讓直播主查詢點數餘額與變動紀錄。

#### Scenario: 查詢點數餘額

- **GIVEN** 直播主已登入
- **WHEN** 呼叫 `GET /api/streamer/points`
- **THEN** 回傳目前點數餘額

#### Scenario: 查詢點數變動紀錄

- **GIVEN** 直播主已登入
- **WHEN** 呼叫 `GET /api/streamer/points?include_logs=true`
- **THEN** 回傳點數餘額與最近的變動紀錄（分頁）

### Requirement: Points Display

系統 **SHALL** 在直播主後台顯示點數餘額。

#### Scenario: 後台顯示點數

- **GIVEN** 直播主登入後台
- **WHEN** 進入儀表板或設定頁面
- **THEN** 顯示目前點數餘額

### Requirement: Points No Expiry

系統 **SHALL** 確保點數永久有效，不設過期時間。

#### Scenario: 點數長期保留

- **GIVEN** 直播主累積了 1000 點
- **WHEN** 經過任意時間長度
- **THEN** 點數餘額保持 1000 點不變

### Requirement: Points Logging

系統 **SHALL** 對所有點數變動記錄結構化日誌。

#### Scenario: 點數變動日誌格式

- **GIVEN** 任何點數變動發生
- **WHEN** 變動完成
- **THEN** 記錄 `warn` level 日誌
- **AND** 包含 `streamer_id`, `before`, `after`, `reason` 欄位
