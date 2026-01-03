# Tasks: 金流與點數系統

## 1. 資料庫 Schema

- [ ] 1.1 建立 `Payments` 表 schema (id, question_id, amount, status, recur_payment_id, refund_reason, timestamps)
- [ ] 1.2 建立 `PointsLogs` 表 schema (id, streamer_id, amount, balance_before, balance_after, reason, reference_id, created_at)
- [ ] 1.3 在 `Streamers` 表新增 `points_balance` 欄位
- [ ] 1.4 執行 migration 並驗證 schema

## 2. Recur 金流整合

- [ ] 2.1 設定 Recur SDK 與環境變數（Sandbox/Production 金鑰）
- [ ] 2.2 實作 `POST /api/payments/create` - 建立付款意圖
- [ ] 2.3 實作付款前端流程（選擇金額、呼叫 Recur SDK）
- [ ] 2.4 實作 `POST /api/webhooks/recur` - Webhook 處理
- [ ] 2.5 Webhook 簽名驗證

## 3. 點數系統

- [ ] 3.1 實作點數增加邏輯（付款成功觸發）
- [ ] 3.2 實作點數扣除邏輯（退款觸發）
- [ ] 3.3 實作點數變動日誌記錄
- [ ] 3.4 實作 `GET /api/streamer/points` - 取得點數餘額與變動紀錄
- [ ] 3.5 點數餘額顯示於直播主後台 UI

## 4. 退款機制

- [ ] 4.1 實作退款觸發邏輯（直播主隱藏留言時）
- [ ] 4.2 呼叫 Recur API 執行退款
- [ ] 4.3 使用 Database Transaction 確保資料一致性
- [ ] 4.4 退款失敗處理與通知機制
- [ ] 4.5 實作退款成功 Email 通知（發送給觀眾）

## 5. 日誌與監控

- [ ] 5.1 擴充 `structuredLog` - 新增 payment、points 日誌方法
- [ ] 5.2 金流操作使用 `warn` level 日誌
- [ ] 5.3 點數變動使用 `warn` level 日誌

## 6. 測試

- [ ] 6.1 單元測試 - 點數計算邏輯
- [ ] 6.2 單元測試 - 退款流程
- [ ] 6.3 單元測試 - Webhook 冪等性
- [ ] 6.4 整合測試 - Recur Sandbox 付款流程
- [ ] 6.5 整合測試 - 並發點數扣除情境

## 7. 驗收

- [ ] 7.1 TypeScript 型別檢查通過
- [ ] 7.2 ESLint 檢查通過
- [ ] 7.3 所有測試通過
- [ ] 7.4 E2E 測試：投稿 → 付款 → 點數增加 → 隱藏留言 → 退款 → 點數扣除
