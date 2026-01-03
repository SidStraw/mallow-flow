# Design: 金流與點數系統

## Context

Mallow Flow 採用「群眾募資型 SaaS」商業模式，觀眾支付平台服務費後：
1. 留言進入直播主收件匣
2. 直播主獲得對應點數
3. 若留言被移除，觸發退款並扣除點數

此設計需確保金流安全、資料一致性，並符合「非抖內」定位的法規要求。

## Goals / Non-Goals

### Goals

- 整合 Recur 金流服務，支援信用卡、Apple Pay、Google Pay
- 實作點數經濟系統（1 TWD = 1 Point）
- 實作自動退款機制
- 確保金流操作的資料一致性（Transaction 保護）
- 完整的審計日誌

### Non-Goals

- Phase 4 的 Premium 訂閱扣點功能（本階段僅實作點數累積）
- 提現功能（不在本階段範圍）
- 多幣別支援（僅支援 TWD）

## Decisions

### 1. Payment Status 狀態機

```
pending → completed → refunded
    ↓         
  failed      
```

- `pending`: 付款意圖已建立，等待 Webhook 確認
- `completed`: 付款成功
- `refunded`: 已退款
- `failed`: 付款失敗

**理由**: 簡化狀態管理，Recur Webhook 僅需處理成功/失敗/退款三種事件。

### 2. 點數變動 Transaction 策略

```typescript
await db.transaction(async (tx) => {
  // 1. 鎖定直播主記錄（SELECT FOR UPDATE）
  const streamer = await tx
    .select()
    .from(streamers)
    .where(eq(streamers.id, streamerId))
    .for('update');
  
  // 2. 計算新餘額
  const newBalance = streamer.points_balance + amount;
  
  // 3. 更新餘額
  await tx.update(streamers)
    .set({ points_balance: newBalance })
    .where(eq(streamers.id, streamerId));
  
  // 4. 記錄日誌
  await tx.insert(pointsLogs).values({
    streamer_id: streamerId,
    amount,
    balance_before: streamer.points_balance,
    balance_after: newBalance,
    reason,
    reference_id: paymentId
  });
});
```

**理由**: 使用 `SELECT FOR UPDATE` 悲觀鎖避免並發扣點導致餘額錯誤。考慮到退款扣點可能同時發生，悲觀鎖比樂觀鎖更適合。

### 3. Webhook 冪等性

使用 `recur_payment_id` 作為唯一鍵，重複的 Webhook 請求會被忽略：

```typescript
// 檢查是否已處理過
const existing = await db.select()
  .from(payments)
  .where(eq(payments.recur_payment_id, recurPaymentId));

if (existing.length > 0) {
  return { status: 'already_processed' };
}
```

**理由**: Webhook 可能因網路問題重複發送，必須確保冪等性。

### 4. 退款失敗處理

當 Recur API 退款失敗時：

1. 不扣除直播主點數
2. 記錄 `error` level 日誌
3. 建立人工退款佇列記錄
4. 透過 Webhook 通知開發者

```typescript
try {
  await recurApi.refund(paymentId);
  await deductPoints(streamerId, amount);
} catch (error) {
  await db.insert(manualRefundQueue).values({
    payment_id: paymentId,
    reason: 'api_failure',
    error_message: error.message
  });
  structuredLog.error('refund_failed', { paymentId, error });
  // 不扣除點數，等待人工處理
}
```

**理由**: 退款失敗不應影響觀眾權益，需人工介入處理。

## Risks / Trade-offs

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| Recur 不支援全自動退款 | 退款需人工操作 | 建立人工退款佇列，通知開發者 |
| 並發點數操作 | 餘額計算錯誤 | 使用 SELECT FOR UPDATE 悲觀鎖 |
| Webhook 簽名偽造 | 安全風險 | 驗證 Recur Webhook 簽名 |
| 退款超過時限（180天） | 無法自動退款 | 記錄警告日誌，人工處理 |

## Migration Plan

### 階段 1: Schema Migration

```sql
-- 1. 建立 Payments 表
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id INTEGER REFERENCES questions(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  recur_payment_id TEXT UNIQUE,
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 建立 PointsLogs 表
CREATE TABLE points_logs (
  id SERIAL PRIMARY KEY,
  streamer_id TEXT REFERENCES streamers(id),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 擴充 Streamers 表
ALTER TABLE streamers ADD COLUMN points_balance INTEGER DEFAULT 0;
```

### 階段 2: API 部署

1. 部署付款 API（Sandbox 模式）
2. 驗證 Webhook 接收
3. 切換至 Production 金鑰

### Rollback

- Schema: 保留舊欄位，新增欄位設 nullable
- API: 使用 Feature Flag 控制金流功能開關

## Decisions (Confirmed)

1. **退款通知**: 透過 Email 通知觀眾退款成功
2. **最低金額**: 維持最低 30 TWD 不變
3. **點數顯示精度**: 不支援小數點，僅使用整數（1 TWD = 1 Point）
