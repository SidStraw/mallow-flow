# Change: 金流與點數系統

## Why

整合 Recur 金流服務，實作點數經濟系統與退款機制，實現「群眾募資型 SaaS」商業模式。觀眾支付平台服務費解鎖 AI 功能，同時為直播主累積點數。

## What Changes

- **ADDED**: `Payments` 資料表 - 付款記錄管理
- **ADDED**: `PointsLogs` 資料表 - 點數變動審計日誌
- **ADDED**: 付款流程整合 Recur API（信用卡、Apple Pay、Google Pay）
- **ADDED**: 點數系統（1 TWD = 1 Point）
- **ADDED**: 退款機制 - 直播主隱藏留言時自動退款
- **ADDED**: API Endpoints 用於付款、Webhook 處理、點數查詢

## Impact

- Affected specs:
  - `payment` (新增)
  - `points` (新增)
- Affected code:
  - `server/database/schema/` - Payments、PointsLogs 表
  - `server/api/payments/` - 付款相關 API
  - `server/api/webhooks/` - Recur Webhook 處理
  - `server/api/streamer/` - 點數查詢 API
  - `server/utils/structured-logger.ts` - 金流日誌

## Dependencies

- `add-core-messaging-flow` (需先完成) - Question 資料表與留言流程

## Risks

1. **金流自動化退款**: 需確認 Recur/TapPay 支援全自動退款 API
2. **並發問題**: 點數扣除需使用 `SELECT FOR UPDATE` 或樂觀鎖
3. **Webhook 冪等性**: Webhook 可能重複發送，需做冪等檢查
4. **退款時限**: 確認 Recur 退款時限（通常 180 天內）
