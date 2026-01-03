# Change: 新增 AI 分析功能

## Why

直播主需要 AI 輔助工具來有效管理大量留言。透過內容審核保護直播主免受惡意內容影響，而情緒分析、自動標籤與自動摘要功能則幫助 Premium 用戶更快速地篩選與回應留言。

## What Changes

### 資料庫 Schema 擴充

- `Questions` 表新增 AI 相關欄位：
  - `ai_review_status` - AI 審核狀態 ('pending', 'pass', 'reject')
  - `sentiment_score` - 情緒分數 (0-1)
  - `ai_tags` - 自動標籤陣列 (JSONB)
  - `ai_summary` - 自動摘要 (Text)
  - `ai_review_reason` - AI 拒絕原因 (Nullable)
- 新增 `AiUsageLogs` 表追蹤 AI 使用量與成本

### AI 內容審核

- 投稿前使用 Gemini 3 Flash Lite 進行快速內容審核
- 偵測惡意、攻擊性、不當內容
- 通過審核後發放 `validation_token` 進入付款流程
- 拒絕時顯示友善訊息

### Premium AI 功能

- **情緒分析**: 分析留言情緒，輸出 0-1 分數
- **自動標籤**: 自動分類留言 (問題、建議、閒聊、點歌、感謝、其他)
- **自動摘要**: 為超過 100 字的留言產生 50 字以內摘要

### AI 配額監控

- 每個 Premium 直播主 3 USD/月額度
- 追蹤 token 使用量與成本
- 超額時記錄 warn 日誌並通知（不停用服務）

### 新增 API Endpoints

- `POST /api/ai/moderate` - 內容審核
- `POST /api/ai/analyze` - 完整 AI 分析
- `GET /api/streamer/ai-usage` - AI 使用量統計

## Impact

- **新增 capabilities**: `ai-analysis`
- **修改 capabilities**: 無（為新功能）
- **依賴**:
  - `add-core-messaging-flow` - 需要 Questions 表結構
  - `add-payment-and-points-system` - 需要判斷 Premium 狀態
- **外部依賴**: Google Gemini API (`@google/generative-ai`)
- **關鍵檔案**:
  - `server/database/schema.ts` - Schema 擴充
  - `server/api/ai/` - AI 相關 API 端點
  - `server/services/ai/` - AI 服務層
  - `server/middleware/ai-quota-tracker.ts` - 配額追蹤中介層
