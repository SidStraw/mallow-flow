# Phase 4: AI 分析功能提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`add-ai-analysis-features`

## 目標

整合 Google Gemini API，實作內容審核、情緒分析、自動標籤與自動摘要功能。

### 具體交付項目

1. **資料庫 Schema 擴充**
   - `Questions` 表新增欄位：
     - `ai_review_status` (Text) - 'pending', 'pass', 'reject'
     - `sentiment_score` (Decimal) - AI 情緒分數 (0-1)
     - `ai_tags` (JSONB) - AI 自動標籤陣列
     - `ai_summary` (Text) - AI 自動產生的短摘要
     - `ai_review_reason` (Text, Nullable) - AI 拒絕原因
   - `AiUsageLogs` 表：AI 使用量追蹤
     - `id` (Serial, PK)
     - `streamer_id` (Text, FK)
     - `model` (Text) - 使用的模型
     - `input_tokens` (Integer)
     - `output_tokens` (Integer)
     - `cost_usd` (Decimal) - 計算成本
     - `created_at` (Timestamp)

2. **AI 預審（Content Moderation）**
   - 投稿前自動審核內容
   - 使用 Gemini 3 Flash Lite 進行快速審核
   - 偵測惡意、攻擊性、不當內容
   - 通過審核後發放 `validation_token` 進入付款流程
   - 未通過時顯示友善的拒絕訊息

3. **情緒分析（Sentiment Analysis）**
   - Premium 功能
   - 使用 Gemini 3 Flash 分析留言情緒
   - 輸出 0-1 分數（0=負面, 0.5=中性, 1=正面）
   - 在收件匣顯示情緒指標

4. **自動標籤（Auto Tagging）**
   - Premium 功能
   - 自動分類留言主題
   - 預設標籤：問題、建議、閒聊、點歌、感謝、其他
   - 直播主可自訂標籤（未來功能）
   - 支援多標籤

5. **自動摘要（Auto Summary）**
   - Premium 功能
   - 為長留言產生簡短摘要
   - 觸發條件：內容超過 100 字
   - 摘要長度：50 字以內

6. **AI 配額監控**
   - 每個 Premium 直播主 3 USD/月 額度
   - 追蹤 token 使用量與成本
   - 超額時記錄 warn 日誌並通知
   - **不停用服務**，持續追蹤

7. **API Endpoints**
   - `POST /api/ai/moderate` - AI 內容審核
   - `POST /api/ai/analyze` - 完整 AI 分析（情緒+標籤+摘要）
   - `GET /api/streamer/ai-usage` - AI 使用量統計

## 技術規範

### AI 整合

- **Provider**: Google Gemini API
- **Models**:
  - `gemini-3-flash-lite` - 內容審核（低成本、快速）
  - `gemini-3-flash` - 情緒分析、標籤、摘要
- **SDK**: `@google/generative-ai` 或 REST API

### Prompt 設計

```typescript
// 內容審核 Prompt
const moderationPrompt = `
作為內容審核系統，分析以下留言是否包含：
1. 仇恨言論或歧視
2. 人身攻擊或霸凌
3. 色情或不當內容
4. 垃圾訊息或廣告

回傳 JSON: { "pass": boolean, "reason": string | null }
`;

// 情緒分析 Prompt
const sentimentPrompt = `
分析以下留言的情緒，回傳 0-1 的分數。
0 = 非常負面, 0.5 = 中性, 1 = 非常正面
僅回傳數字，不要其他文字。
`;
```

### 降級策略

- AI API 失敗時：
  - 內容審核：改為人工審核佇列
  - 情緒/標籤/摘要：設為 null，不阻擋流程
- 記錄錯誤並通知開發者

### 執行時間限制

- Cloudflare Workers CPU 限制：50-100ms
- 解決方案：
  - 使用 Cloudflare Queues 進行非同步處理
  - 或使用 Durable Objects 處理長時間任務

## 依賴

- `add-core-messaging-flow`（需先完成）
- `add-payment-and-points-system`（需要點數系統判斷 Premium 狀態）

## 驗收標準

### 功能驗收

- [ ] 惡意留言在付款前被拒絕
- [ ] 拒絕時顯示友善的錯誤訊息
- [ ] Free 用戶看不到情緒/標籤/摘要
- [ ] Premium 用戶看到完整 AI 分析結果
- [ ] 長留言自動產生摘要
- [ ] AI 使用量正確記錄

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] AI 呼叫有適當的錯誤處理
- [ ] 降級策略正常運作
- [ ] 單元測試模擬 AI 回應
- [ ] 配額監控正確計算成本

## 風險與注意事項

1. **API 延遲**
   - Gemini API 回應時間可能 1-5 秒
   - 需確保不超過 Serverless timeout
   - 考慮使用 streaming 回應

2. **成本控制**
   - 追蹤每個直播主的使用成本
   - 超額時通知但不停用
   - 考慮實作 token 使用量預估

3. **Prompt Injection**
   - 防止使用者在留言中注入惡意 prompt
   - 使用 system prompt 明確界定任務
   - 對輸出進行驗證

4. **模型一致性**
   - AI 輸出可能不穩定
   - 實作輸出格式驗證
   - 考慮重試機制

## 上下文參考

### AI 功能層級（來自 project.md）

| 功能 | Free Tier | Premium Tier |
| --- | --------- | ------------ |
| 基礎留言審核 | ✅ | ✅ |
| 情緒分析 | ❌ | ✅ |
| 自動標籤 | ❌ | ✅ |
| 自動摘要 | ❌ | ✅ |

### AI 配額管理（來自 project.md）

- **預算**: 每個開啟 AI 功能的直播主分配 3 USD/月 額度
- **超額處理**: 不停用服務，通知開發者查閱日誌

### 日誌規範

| 事件類型 | Log Level | 必要欄位 |
| -------- | --------- | -------- |
| AI 呼叫 | `info` | `model`, `tokens`, `duration`, `streamer_id`, `cost` |

---

請產生 `proposal.md`、`tasks.md`、`design.md`（因為有 AI 整合的技術決策）和 `spec.deltas.md`，建立 `ai-analysis` capability 的 specs。
