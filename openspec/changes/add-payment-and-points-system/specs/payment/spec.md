## ADDED Requirements

### Requirement: Payment Creation

系統 **SHALL** 提供付款意圖建立功能，觀眾投稿時可選擇付款金額並完成支付。

#### Scenario: 建立付款意圖成功

- **GIVEN** 觀眾已完成留言內容輸入
- **WHEN** 觀眾選擇付款金額（最低 30 TWD）並提交
- **THEN** 系統建立 `pending` 狀態的付款記錄
- **AND** 回傳 Recur 付款頁面所需參數

#### Scenario: 付款金額低於最低限制

- **GIVEN** 觀眾嘗試建立付款
- **WHEN** 付款金額低於 30 TWD
- **THEN** 系統回傳錯誤訊息「付款金額不得低於 30 TWD」

### Requirement: Recur Integration

系統 **SHALL** 整合 Recur 金流服務，支援信用卡、Apple Pay、Google Pay 支付方式。

#### Scenario: 信用卡付款

- **GIVEN** 觀眾選擇信用卡付款
- **WHEN** 輸入有效的信用卡資訊並完成驗證
- **THEN** Recur 處理付款並透過 Webhook 通知系統

#### Scenario: Apple Pay 付款

- **GIVEN** 觀眾選擇 Apple Pay 付款
- **WHEN** 完成 Apple Pay 授權
- **THEN** Recur 處理付款並透過 Webhook 通知系統

#### Scenario: Google Pay 付款

- **GIVEN** 觀眾選擇 Google Pay 付款
- **WHEN** 完成 Google Pay 授權
- **THEN** Recur 處理付款並透過 Webhook 通知系統

### Requirement: Webhook Processing

系統 **SHALL** 處理 Recur Webhook 事件，更新付款狀態並觸發後續流程。

#### Scenario: 付款成功 Webhook

- **GIVEN** 系統收到 Recur 付款成功 Webhook
- **WHEN** Webhook 簽名驗證通過
- **THEN** 付款狀態更新為 `completed`
- **AND** 留言狀態更新為 `pending`（等待 AI 審核或進入收件匣）
- **AND** 直播主點數增加對應金額

#### Scenario: 付款失敗 Webhook

- **GIVEN** 系統收到 Recur 付款失敗 Webhook
- **WHEN** Webhook 簽名驗證通過
- **THEN** 付款狀態更新為 `failed`
- **AND** 留言不進入收件匣

#### Scenario: Webhook 簽名驗證失敗

- **GIVEN** 系統收到 Recur Webhook
- **WHEN** Webhook 簽名驗證失敗
- **THEN** 回傳 401 錯誤
- **AND** 記錄 `error` level 日誌

#### Scenario: Webhook 冪等性

- **GIVEN** 系統已處理過某筆付款的 Webhook
- **WHEN** 收到相同 `recur_payment_id` 的重複 Webhook
- **THEN** 回傳成功但不重複處理
- **AND** 不重複增加點數

### Requirement: Refund Processing

系統 **SHALL** 在直播主隱藏留言時自動執行退款，並從直播主帳戶扣除對應點數。

#### Scenario: 退款成功

- **GIVEN** 直播主隱藏某則付費留言
- **WHEN** 呼叫 Recur API 執行退款成功
- **THEN** 付款狀態更新為 `refunded`
- **AND** 直播主點數扣除對應金額
- **AND** 記錄 `warn` level 日誌
- **AND** 發送 Email 通知觀眾退款成功

#### Scenario: 退款失敗

- **GIVEN** 直播主隱藏某則付費留言
- **WHEN** 呼叫 Recur API 執行退款失敗
- **THEN** 付款狀態保持 `completed`
- **AND** 直播主點數不扣除
- **AND** 記錄 `error` level 日誌
- **AND** 建立人工退款佇列記錄

#### Scenario: 退款超過時限

- **GIVEN** 付款已超過 180 天
- **WHEN** 直播主嘗試隱藏該留言
- **THEN** 系統記錄 `warn` level 日誌
- **AND** 建立人工退款佇列記錄

### Requirement: Payment Logging

系統 **SHALL** 對所有金流操作記錄結構化日誌。

#### Scenario: 付款操作日誌

- **GIVEN** 任何付款相關操作發生（建立、成功、失敗、退款）
- **WHEN** 操作完成
- **THEN** 記錄 `warn` level 日誌
- **AND** 包含 `action`, `amount`, `payment_id`, `streamer_id` 欄位
