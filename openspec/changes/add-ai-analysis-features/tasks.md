# Tasks: AI 分析功能實作清單

## 依賴關係

此變更依賴以下提案完成後才能實作：
- `add-core-messaging-flow` - 需要 Questions 表結構
- `add-payment-and-points-system` - 需要 Premium 狀態判斷

---

## 1. 資料庫 Schema 擴充

- [ ] 1.1 擴充 `Questions` 表，新增 AI 相關欄位：
  - `ai_review_status` (Text, default 'pending')
  - `sentiment_score` (Decimal, nullable)
  - `ai_tags` (JSONB, nullable)
  - `ai_summary` (Text, nullable)
  - `ai_review_reason` (Text, nullable)
- [ ] 1.2 建立 `AiUsageLogs` 表：
  - `id` (Serial, PK)
  - `streamer_id` (Text, FK → Streamers)
  - `model` (Text)
  - `input_tokens` (Integer)
  - `output_tokens` (Integer)
  - `cost_usd` (Decimal)
  - `feature` (Text) - 'moderation' | 'sentiment' | 'tagging' | 'summary'
  - `created_at` (Timestamp)
- [ ] 1.3 執行 Drizzle migration 並驗證 schema

## 2. AI 服務層

- [ ] 2.1 安裝 `@google/generative-ai` 套件
- [ ] 2.2 建立 `server/services/ai/gemini-client.ts` - Gemini API 封裝
- [ ] 2.3 建立 `server/services/ai/prompts.ts` - Prompt 模板定義
- [ ] 2.4 建立 `server/services/ai/schemas.ts` - AI 輸出 Zod Schema
- [ ] 2.5 實作 `server/services/ai/moderation.service.ts` - 內容審核服務
- [ ] 2.6 實作 `server/services/ai/analysis.service.ts` - 情緒/標籤/摘要服務
- [ ] 2.7 實作 `server/services/ai/cost-calculator.ts` - 成本計算工具
- [ ] 2.8 撰寫 AI 服務單元測試（Mock Gemini API 回應）

## 3. 配額追蹤機制

- [ ] 3.1 建立 `server/services/ai/usage-tracker.ts` - 使用量追蹤服務
- [ ] 3.2 實作 `server/middleware/ai-quota-tracker.ts` - 配額追蹤中介層
- [ ] 3.3 實作超額通知邏輯（記錄 warn log）
- [ ] 3.4 撰寫配額追蹤單元測試

## 4. API 端點實作

- [ ] 4.1 實作 `POST /api/ai/moderate` - 內容審核端點
  - 輸入：留言內容
  - 輸出：`{ pass: boolean, reason?: string, validationToken?: string }`
- [ ] 4.2 實作 `POST /api/ai/analyze` - 完整 AI 分析端點
  - 輸入：留言 ID
  - 輸出：`{ sentiment: number, tags: string[], summary?: string }`
  - 條件：僅 Premium 直播主可使用
- [ ] 4.3 實作 `GET /api/streamer/ai-usage` - AI 使用量統計端點
  - 輸出：當月使用量、成本、按功能統計
- [ ] 4.4 撰寫 API 端點整合測試

## 5. 降級策略實作

- [ ] 5.1 實作內容審核降級：AI 失敗時設定 `ai_review_status = 'pending'`
- [ ] 5.2 實作 Premium 功能降級：AI 失敗時欄位設為 null
- [ ] 5.3 實作重試機制（最多 2 次，含指數退避）
- [ ] 5.4 撰寫降級策略測試

## 6. 整合與驗證

- [ ] 6.1 TypeScript 型別檢查通過
- [ ] 6.2 ESLint 檢查通過
- [ ] 6.3 執行所有單元測試
- [ ] 6.4 撰寫 E2E 測試：惡意留言被拒絕流程
- [ ] 6.5 撰寫 E2E 測試：Premium 用戶看到完整 AI 分析
- [ ] 6.6 驗證 AI 配額追蹤正確計算成本
- [ ] 6.7 驗證降級策略正常運作

## 7. 文件更新

- [ ] 7.1 更新 API 文件（若有 API docs）
- [ ] 7.2 更新 README 說明 AI 功能設定

---

## 驗收標準

### 功能驗收

- [ ] 惡意留言在付款前被拒絕
- [ ] 拒絕時顯示友善的錯誤訊息
- [ ] Free 用戶看不到情緒/標籤/摘要
- [ ] Premium 用戶看到完整 AI 分析結果
- [ ] 超過 100 字的留言自動產生摘要
- [ ] AI 使用量正確記錄

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] AI 呼叫有適當的錯誤處理
- [ ] 降級策略正常運作
- [ ] 單元測試模擬 AI 回應
- [ ] 配額監控正確計算成本
