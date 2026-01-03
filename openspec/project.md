# Project Context

## Purpose

Mallow Flow 是一個專為直播主設計的留言管理工具，解決大量留言難以整理的問題。

### 核心目標

- 提供 AI 驅動的留言分析與管理功能（情緒分析、自動標籤、摘要、語意搜尋）
- 透過「群眾募資型 SaaS」商業模式：觀眾支付平台服務費解鎖 AI 功能，同時為直播主累積點數
- 支援 Twitch 與 YouTube 會員身份驗證，並允許匿名投稿
- 整合 OBS 以即時展示留言 overlay

### 商業模式關鍵

- **非抖內定位**: 明確定義為「平台置頂與 AI 分析服務」而非贈與，規避代收代付法規
- **點數經濟**: 1 TWD = 1 Point，直播主消耗點數維持 AI 訂閱，點數不限期
- **移除即退款**: 服務未履行（留言被移除）時自動退款

## Tech Stack

### Frontend

- **Framework**: Nuxt 4 (Vue 3 + TypeScript)
- **Styling**: TailwindCSS
- **UI Components**: Nuxt UI
- **State Management**: Pinia (全域狀態) + Nuxt 內建 useState (局部狀態)
- **Async State**: TanStack Query (@tanstack/vue-query)
- **Utilities**: VueUse (Composition utilities)、lodash-es (工具函式)
- **Type Safety**: TypeScript (Strict Mode)

### Backend

- **Runtime**: Nuxt Server Routes (Nitro Engine)
- **Deployment**: Cloudflare Pages + Cloudflare Workers
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (自部署在 Zeabur 的 Supabase) + pgvector extension

### Authentication

- **Streamer**: Email Magic Link 或 OAuth (YouTube/Twitch)
  - **Email Magic Link**: 可快速登入，但無法使用會員限制留言功能
  - **OAuth (YouTube/Twitch)**: 驗證頻道權限，解鎖會員限制留言功能
    - **目的**: 確保直播主擁有頻道權限，才能抓取會員等級資料
    - **權限驗證**: 系統驗證 OAuth token，確認是該頻道的擁有者或有編輯權限
  - **會員限制功能**: 僅在 OAuth 連接成功後才可啟用
- **Viewer**: OAuth (Twitch/YouTube/Google) - Sessionless 或短期 JWT 機制
  - **會員限制留言**: 若直播主開通會員限制功能，觀眾投稿時**必須經過 OAuth 驗證**（無法使用匿名投稿）
  - **會員等級檢查**: 系統驗證觀眾在直播平台的會員等級是否達到要求

### AI & ML

- **Provider**: Google Gemini API (優先選用)
- **Models** (優先順序):
  - Gemini 3 Flash (內容審核、情緒分析、標籤、摘要)
  - Gemini 3 Flash Lite (輕量化任務、成本優化)
- **本地模型**: text-embedding-3-small (語意搜尋向量)，不做絕對限制、開發過程中研究並確認具體方案
- **Fallback**: 根據實際效能與成本評估是否補充其他 provider

### Payment

- **Provider**: Recur (基於 TapPay 封裝)
- **Methods**: 信用卡、Apple Pay、Google Pay

### Infrastructure

- **Hosting**: Cloudflare Pages (Nuxt 3 Cloudflare preset)
- **Serverless**: Cloudflare Workers
- **Database**: Zeabur (Supabase self-hosted)
- **Secrets**: Nuxt runtimeConfig + Cloudflare Pages secrets

## Project Conventions

### Code Style

- **語言**: 全專案使用 zh-TW (台灣正體中文) 進行文件與註解撰寫
- **命名規範**:
  - 變數/函數: camelCase
  - 組件: PascalCase
  - 常數: UPPER_SNAKE_CASE
  - Database 欄位: snake_case (由 Drizzle ORM 管理)
- **格式化**: Prettier + ESLint
- **Type Safety**:
  - 啟用 TypeScript Strict Mode
  - 利用 Drizzle ORM Schema 生成型別，確保 DB → Server → Client 端到端型別安全

### Architecture Patterns

- **Serverless-First**: 充分利用 Cloudflare Workers Edge Network，將驗證與 AI 預審邏輯部署在邊緣節點
- **Optimistic UI**: 直播主後台操作（移除/投放）立即更新介面狀態
- **SWR Strategy**: OBS Overlay 使用 Stale-While-Revalidate 策略進行 3-5 秒 Polling（無 WebSocket）
- **Transaction-First**: 點數扣除、退款等金流操作必須使用 Database Transaction
- **Cache Strategy**: 第三方平台 API 查詢（YT/Twitch 會員等級）需實作快取機制

### Testing Strategy

- **單元測試** (Vitest):
  - 目標覆蓋率: **80% 以上**
  - 重點: 測試狀態管理與業務邏輯（錨點日期演算法、點數計算、退款流程等）
- **組件測試** (Testing Library):
  - 僅測試**關鍵流程**的 UI 組件
  - 重點: 表單驗證、留言卡片渲染、會員等級顯示
- **E2E 測試** (Playwright):
  - 僅測試**關鍵業務流程**
  - 範例: 觀眾投稿 → 付款 → 留言進入收件匣 → 直播主移除 → 退款

### Git Workflow

- **Commit Convention**: Conventional Commits
  - `feat:` 新功能
  - `fix:` 錯誤修復
  - `chore:` 雜項（依賴更新、配置調整）
  - `docs:` 文件更新
  - `test:` 測試相關
  - `refactor:` 重構
- **分支策略**: GitHub Flow
  - `main`: 穩定版本
  - `feature/*`: 功能開發分支
  - Pull Request 必須通過型別檢查與測試後才能合併

## Domain Context

### 直播平台整合

#### YouTube

- **會員驗證優先順序**: 優先支援
- **會員等級對應**:
  - 以 `levelId` 為主鍵
  - 必須建立 `levelId` ↔ 會員等級名稱對應表（防刪除等級後無法對應）
  - 儲存至 `Questions.member_tier_metadata` (JSONB)
- **API**: YouTube Data API v3 + YouTube Membership API

#### Twitch

- **會員驗證優先順序**: 同時支援
- **會員等級對應**:
  - 使用平台標準 Tier 1/2/3
  - 對應至 `Questions.member_tier`: 1 = T1, 2 = T2, 3 = T3, 0 = 非會員
- **API**: Twitch Helix API

#### OBS 整合

- **與平台無關**: OBS overlay
- **更新機制**: 使用 SWR Polling (3-5 秒間隔)
- **斷線處理**: 設計容錯機制，避免短暫斷線導致 overlay 崩潰

### AI 功能層級

| 功能 | Free Tier | Premium Tier | 技術實作 |
| --- | --------- | ------------ | ------- |
| 基礎留言審核 | ✅ | ✅ | Gemini 3 Flash / Flash Lite (Moderation) |
| 情緒分析 | ❌ | ✅ | Gemini 3 Flash (Sentiment Score) |
| 自動標籤 | ❌ | ✅ | Gemini 3 Flash (Classification) |
| 自動摘要 | ❌ | ✅ | Gemini 3 Flash (Summarization) |
| 語意搜尋 | ❌ | ✅ | text-embedding-3-small + pgvector |

### 錨點日期演算法 (Anchor Date Algorithm)

- **目的**: 確保大小月切換公平性
- **定義**: 首次付費日為 Anchor Day (儲存至 `Streamers.subscription_anchor_day`)
- **計算公式**:

> Next Month = 當前日期 + 1 個月
> Target Day = Min(Anchor Day, Next Month 的最後一天)

- **範例**: Anchor Day = 31，續訂發生在 2 月 → Target Day = 28

### 金流與退款流程

1. **投稿流程**:
   - 觀眾選擇身份（匿名 / OAuth 驗證）
   - AI 預審內容 → 通過後發放 `validation_token`
   - 進入付款流程（Recur API）
   - Webhook 確認付款 → 更新狀態 + 增加點數 + 進入收件匣
2. **退款觸發**:
   - 直播主移除留言 → 設定 `is_hidden_by_streamer = true`
   - 呼叫 Recur API 執行退款
   - 從直播主帳戶扣除對應點數（需 Transaction 保護）

## Important Constraints

### 技術限制

- **無 WebSocket**: Serverless 環境不使用長連線，改用 Polling + Optimistic UI
- **Serverless Timeout**:
  - Cloudflare Workers 限制: CPU 時間 50ms (免費) / 50-100ms (付費)
  - AI 分析與 Webhook 需注意執行時間，超過需拆分或使用 Durable Objects
- **並發控制**: 點數扣除需使用 PostgreSQL Transaction，避免 Race Condition

### 商業與法規

- **非抖內定位**:
  - 必須在 UI/UX 中明確標示為「購買平台服務」而非「贈與」
  - 避免代收代付法規風險（目前無法律顧問文件）
- **退款政策**: 服務未履行時**必須退款**，需確保 Recur/TapPay 支援全自動退款

### AI 配額管理

- **預算**: 每個開啟 AI 功能的直播主分配 **3 USD/月** 額度
- **超額處理**:
  - 不停用服務
  - 通知開發者查閱日誌（透過 Cloudflare Workers 日誌或第三方監控服務）
- **Rate Limiting**: 實作每直播主的 API 呼叫頻率限制

### 資料保護

- **GDPR/個資法**:
  - 匿名投稿不蒐集個資
  - OAuth 驗證僅取得必要欄位（會員等級、User ID）
  - 提供留言刪除與帳號註銷功能

## External Dependencies

### Payment Gateway

- **Provider**: Recur (TapPay 封裝)
- **功能**: 信用卡、Apple Pay、Google Pay、自動退款
- **Webhook**: 需處理付款成功、失敗、退款等事件
- **測試環境**: 需區分 Sandbox 與 Production 金鑰

### AI Services

- **Google Gemini API**:
  - Models: `gemini-3-flash`, `gemini-3-flash-lite`
  - Rate Limit: 需監控 RPM (Requests Per Minute)
  - Fallback: 考慮 AI 服務失敗時的降級方案
- **Embedding Model**:
  - Provider: OpenAI
  - Model: `text-embedding-3-small`
  - 用途: 語意搜尋向量生成

### OAuth Providers

- **YouTube**:
  - API: YouTube Data API v3, YouTube Membership API
  - Scope: `youtube.readonly`, `youtube.force-ssl`
  - 配額: 每日 10,000 units（需快取會員等級查詢結果）
- **Twitch**:
  - API: Twitch Helix API
  - Scope: `user:read:subscriptions`
  - Rate Limit: 800 requests/min
- **Google OAuth**: 用於一般觀眾登入（非 YT 會員驗證）

### Database

- **Supabase (Self-Hosted on Zeabur)**:
  - PostgreSQL 15+
  - Extensions: `pgvector` (語意搜尋)
  - Connection Pooling: 建議使用 PgBouncer
  - Backup: 每日自動備份

### Monitoring & Logging

#### 基礎設施監控

- **Cloudflare Workers Analytics**: 追蹤 Worker 執行時間與錯誤率
- **Sentry**: 錯誤追蹤與效能監控（建議整合）
- **Database Logs**: 監控慢查詢與 AI 配額超標情況

#### 結構化日誌策略

**日誌工具**: 使用 `consola` 進行結構化 logging

- 生產環境: 僅記錄 `warn` 和 `error` level
- 開發環境: 記錄 `info` level 以上
- 格式: JSON 格式，包含時間戳記

**日誌存儲方案** (優先順序):

1. **Cloudflare Logpush + Analytics Engine** (優先) - 原生整合，免費額度
2. **Axiom** - Cloudflare Workers 原生支援
3. **Better Stack** (原 Logtail) - 結構化日誌 + 告警功能
4. **Baselime** - Serverless 專用可觀測性平台

#### 關鍵事件追蹤

必須記錄的事件類型：

| 事件類型 | Log Level | 必要欄位 |
| --------- | ----------- | --------- |
| API 請求/回應 | `info` | `method`, `path`, `status`, `duration`, `streamer_id` |
| AI 呼叫 | `info` | `model`, `tokens`, `duration`, `streamer_id`, `cost` |
| 金流操作 | `warn` | `action`, `amount`, `payment_id`, `streamer_id` |
| 點數變動 | `warn` | `streamer_id`, `before`, `after`, `reason` |
| OAuth 驗證 | `info` | `provider`, `streamer_id`, `success` |
| 錯誤事件 | `error` | `error.message`, `error.stack`, `context` |

#### AI 配額監控（重點）

- **監控指標**: 每個直播主的 AI 使用量（USD/月）
- **警告閾值**: 3 USD/月
- **超額處理**:
  - 記錄 `warn` level 日誌
  - 透過 Webhook 或 Email 通知開發者
  - **不停用服務**，持續追蹤使用量
- **實作位置**: `server/middleware/ai-quota-tracker.ts`

#### 實作規範

```typescript
// server/utils/structured-logger.ts
export const structuredLog = {
  api: (event, duration) => { /* 記錄 API 請求 */ },
  ai: (streamerId, model, tokens, cost) => { /* 記錄 AI 呼叫 */ },
  payment: (action, amount, paymentId) => { /* 記錄金流事件 */ }
}
```

所有 log 必須包含：

- `timestamp`: ISO 8601 格式
- `level`: info/warn/error
- `context`: 相關業務資訊（streamer_id, project_id 等）
