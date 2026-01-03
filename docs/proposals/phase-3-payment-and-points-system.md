# Phase 3: 金流與點數系統提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`add-payment-and-points-system`

## 目標

整合 Recur 金流服務，實作點數經濟系統與退款機制。

### 具體交付項目

1. **資料庫 Schema 擴充**
   - `Payments` 表：付款記錄
     - `id` (UUID, PK)
     - `question_id` (Integer, FK)
     - `amount` (Integer) - 付款金額（TWD）
     - `status` (Text) - 'pending', 'completed', 'refunded', 'failed'
     - `recur_payment_id` (Text) - Recur 交易 ID
     - `refund_reason` (Text, Nullable) - 退款原因
     - `created_at` (Timestamp)
     - `updated_at` (Timestamp)
   - `PointsLogs` 表：點數變動日誌（審計用途）
     - `id` (Serial, PK)
     - `streamer_id` (Text, FK)
     - `amount` (Integer) - 變動金額（正數增加、負數扣除）
     - `balance_before` (Integer) - 變動前餘額
     - `balance_after` (Integer) - 變動後餘額
     - `reason` (Text) - 變動原因
     - `reference_id` (Text, Nullable) - 關聯的 Payment ID
     - `created_at` (Timestamp)

2. **付款流程**
   - 投稿時選擇付款金額（最低 30 TWD）
   - 整合 Recur API（信用卡、Apple Pay、Google Pay）
   - 付款成功後：
     - 留言狀態更新為 `pending`（等待 AI 審核或直接進入收件匣）
     - 直播主點數增加
     - 記錄點數變動日誌

3. **點數系統**
   - 1 TWD = 1 Point
   - 點數餘額顯示在直播主後台
   - 點數不過期（依據 project.md 規範）
   - 點數用於維持 Premium 訂閱（Phase 4 實作）

4. **退款機制**
   - 直播主隱藏留言時觸發退款
   - 呼叫 Recur API 執行退款
   - 從直播主帳戶扣除對應點數
   - 使用 Database Transaction 確保資料一致性
   - 退款失敗時記錄錯誤並通知開發者

5. **API Endpoints**
   - `POST /api/payments/create` - 建立付款意圖
   - `POST /api/webhooks/recur` - Recur Webhook 處理
   - `GET /api/streamer/points` - 取得點數餘額與變動紀錄

## 技術規範

### 金流整合

- **Provider**: Recur (TapPay 封裝)
- **環境**: 區分 Sandbox 與 Production
- **Webhook 安全**: 驗證 Webhook 簽名

### Transaction 保護

```typescript
// 點數變動必須使用 Transaction
await db.transaction(async (tx) => {
  // 1. 更新點數餘額
  // 2. 記錄點數變動日誌
  // 3. 更新付款狀態
});
```

### 結構化日誌

根據 project.md 的日誌規範，金流操作使用 `warn` level：

```typescript
structuredLog.payment('refund', amount, paymentId, {
  streamer_id: streamerId,
  reason: 'question_hidden'
});
```

## 依賴

- `add-core-messaging-flow`（需先完成）

## 驗收標準

### 功能驗收

- [ ] 觀眾投稿時可以完成付款
- [ ] 付款成功後直播主點數正確增加
- [ ] 點數餘額顯示在直播主後台
- [ ] 隱藏留言後觀眾收到退款
- [ ] 退款後直播主點數正確扣除
- [ ] 點數變動日誌完整記錄

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] Webhook 處理涵蓋所有事件類型
- [ ] Transaction 正確處理並發情境
- [ ] 單元測試覆蓋金流邏輯
- [ ] 整合測試使用 Recur Sandbox

## 風險與注意事項

1. **金流自動化退款**
   - 需確認 Recur/TapPay 支援全自動退款 API
   - 若不支援，建立人工退款佇列並通知開發者

2. **並發問題**
   - 點數扣除需使用 `SELECT FOR UPDATE` 或樂觀鎖
   - 測試 100+ 同時付款情境

3. **Webhook 冪等性**
   - Webhook 可能重複發送
   - 使用 `recur_payment_id` 做冪等檢查

4. **退款時限**
   - 確認 Recur 退款時限（通常 180 天內）
   - 超過時限的退款需人工處理

## 上下文參考

### 商業模式（來自 project.md）

- **非抖內定位**: 明確定義為「平台置頂與 AI 分析服務」而非贈與
- **點數經濟**: 1 TWD = 1 Point，點數不限期
- **移除即退款**: 服務未履行（留言被移除）時自動退款

### 日誌規範（來自 project.md）

金流操作必須記錄的事件：
| 事件類型 | Log Level | 必要欄位 |
| -------- | --------- | -------- |
| 金流操作 | `warn` | `action`, `amount`, `payment_id`, `streamer_id` |
| 點數變動 | `warn` | `streamer_id`, `before`, `after`, `reason` |

---

請產生 `proposal.md`、`tasks.md` 和 `spec.deltas.md`，建立 `payment` 與 `points` capabilities 的 specs。
