# Phase 1: 基礎設施與資料層提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`setup-database-and-auth`

## 目標

建立專案基礎設施，包含 Nuxt 4 專案初始化、資料庫 Schema 定義與直播主驗證系統。

### 具體交付項目

1. **專案初始化**
   - 使用 `nuxi init` 初始化 Nuxt 4 專案
   - 設定 TailwindCSS + Nuxt UI
   - 設定 TypeScript Strict Mode
   - 設定 Prettier + ESLint
   - 設定 Vitest 測試框架
   - 設定 pnpm 為套件管理工具

2. **資料庫 Schema (Drizzle ORM)**
   - `Streamers` 表：直播主帳號資料
     - `id` (Text, PK) - Auth Provider ID
     - `slug` (Text, Unique) - 個人網址 (e.g., /u/peko)
     - `points_balance` (Integer) - 目前點數餘額 (預設 0)
     - `subscription_expires_at` (Timestamp) - AI 功能到期時間
     - `subscription_anchor_day` (Integer) - 錨點日期 (1-31)
     - `is_accepting_post` (Boolean) - 全局投稿開關
     - `active_tier` (Text) - 'free' 或 'premium'
     - `platform_identity` (JSONB) - 儲存 Twitch/YT Channel ID
   - `Projects` 表：直播主專案/企劃
     - `id` (UUID, PK)
     - `streamer_id` (Text, FK)
     - `name` (Text) - 專案名稱
     - `is_default` (Boolean) - 是否為預設專案
     - `is_active` (Boolean) - 是否啟用中

3. **直播主驗證系統**
   - Email Magic Link 登入（Nuxt Auth Utils）
   - 登入後自動建立預設專案
   - Session 管理（使用 Nuxt Auth Utils 內建機制）

4. **專案管理 API**
   - `GET /api/projects` - 列出直播主專案
   - `POST /api/projects` - 建立新專案
   - `PUT /api/projects/:id` - 更新專案
   - `DELETE /api/projects/:id` - 刪除專案（若有留言則軟刪除）

## 技術規範

### 資料庫

- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Zeabur Supabase 自部署)
- **pgvector**: 預留 extension（Phase 5 使用）
- **Migrations**: 使用 Drizzle Kit 管理

### 驗證

- **Provider**: Nuxt Auth Utils
- **策略**: Email Magic Link（優先）
- **Session**: Server-side session with secure cookies

### 部署環境

- **Hosting**: Cloudflare Pages
- **Preset**: Nuxt Cloudflare preset
- **Secrets**: Nuxt runtimeConfig + Cloudflare Pages secrets

## 依賴

無（此為首個提案）

## 驗收標準

### 功能驗收

- [ ] 專案可使用 `pnpm dev` 正常啟動
- [ ] 直播主可透過 Email Magic Link 註冊/登入
- [ ] 登入後自動建立預設專案
- [ ] 可以建立、更新、刪除專案
- [ ] 專案列表可正確顯示

### 技術驗收

- [ ] TypeScript 型別檢查通過 (`pnpm typecheck`)
- [ ] ESLint 檢查通過 (`pnpm lint`)
- [ ] Drizzle Schema 可成功產生 migrations
- [ ] 單元測試覆蓋率達 80%+
- [ ] API endpoint 有對應的整合測試

## 風險與注意事項

1. **Cloudflare Workers 限制**
   - CPU 時間限制：50ms (免費) / 50-100ms (付費)
   - 需確認 Drizzle ORM 與 Cloudflare Workers 相容性
   - 考慮使用 Hyperdrive 進行資料庫連線池管理

2. **Magic Link 郵件服務**
   - 需選擇郵件服務提供商（Resend / SendGrid / Mailgun）
   - 建議使用 Resend（Cloudflare Workers 原生支援）

3. **資料庫連線**
   - Zeabur Supabase 需設定 Connection Pooling
   - 建議使用 PgBouncer 或 Supabase 內建 Pooler

## 上下文參考

### project.md 關鍵規範

- 語言：全專案使用 zh-TW
- 命名規範：變數/函數 camelCase、組件 PascalCase、DB 欄位 snake_case
- 套件管理：pnpm
- 測試策略：Vitest（目標覆蓋率 80%+）

### 技術堆疊確認

- Frontend: Nuxt 4 (Vue 3 + TypeScript)
- Styling: TailwindCSS + Nuxt UI
- Backend: Nuxt Server Routes (Nitro Engine)
- ORM: Drizzle ORM
- Database: PostgreSQL (Zeabur Supabase)
- Deployment: Cloudflare Pages + Cloudflare Workers

---

請產生 `proposal.md`、`tasks.md` 和 `spec.deltas.md`，並建立對應的 capability specs。
