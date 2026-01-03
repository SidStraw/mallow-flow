# Tasks: setup-database-and-auth

## 1. 專案初始化

- [x] 1.1 使用 `nuxi init` 初始化 Nuxt 4 專案
- [x] 1.2 設定 pnpm 為套件管理工具
- [x] 1.3 安裝並設定 TailwindCSS + Nuxt UI
- [x] 1.4 設定 TypeScript Strict Mode
- [x] 1.5 安裝並設定 Prettier + ESLint (@nuxt/eslint)
- [x] 1.6 安裝並設定 Vitest 測試框架
- [x] 1.7 設定 Cloudflare Pages preset
- [x] 1.8 驗證: `pnpm dev` 可正常啟動

## 2. 資料庫設定

- [x] 2.1 安裝 Drizzle ORM 與 `postgres` driver
- [x] 2.2 建立 Drizzle 設定檔 (`drizzle.config.ts`)
- [x] 2.3 設定 Hyperdrive 連線配置 (透過 runtimeConfig)
- [x] 2.4 建立資料庫連線工具 (`server/utils/db.ts`)
- [x] 2.5 驗證: 可成功連線至 PostgreSQL (透過本地 Supabase Docker)

## 3. Schema 定義

- [x] 3.1 建立 `streamers` 表 Schema
- [x] 3.2 建立 `projects` 表 Schema
- [x] 3.3 產生 Drizzle Migrations (`pnpm db:generate`)
- [x] 3.4 執行 Migrations (`pnpm db:push`)
- [x] 3.5 驗證: Schema 正確建立於資料庫

## 4. 驗證系統

- [x] 4.1 安裝 Nuxt Auth Utils
- [x] 4.2 設定 Resend 郵件服務
- [x] 4.3 實作 Magic Link 發送 API (`POST /api/auth/magic-link`)
- [x] 4.4 實作 Magic Link 驗證 API (`GET /api/auth/verify`)
- [x] 4.5 實作登入後自動建立預設專案邏輯
- [x] 4.6 實作登出 API (`POST /api/auth/logout`)
- [x] 4.7 實作取得當前使用者 API (`GET /api/auth/me`)
- [x] 4.8 撰寫驗證流程單元測試
- [ ] 4.9 驗證: Magic Link 完整登入流程可運作 (需要設定 Resend 正式 API Key)

## 5. 專案管理 API

- [x] 5.1 實作列出專案 API (`GET /api/projects`)
- [x] 5.2 實作建立專案 API (`POST /api/projects`)
- [x] 5.3 實作更新專案 API (`PUT /api/projects/:id`)
- [x] 5.4 實作刪除專案 API (`DELETE /api/projects/:id`)
- [x] 5.5 實作專案驗證中介層 (確認專案所有權)
- [x] 5.6 撰寫專案 API 整合測試
- [ ] 5.7 驗證: 專案 CRUD 功能正常運作 (需要完整登入流程)

## 6. 品質確認

- [x] 6.1 執行 TypeScript 型別檢查 (`pnpm typecheck`)
- [x] 6.2 執行 ESLint 檢查 (`pnpm lint`)
- [x] 6.3 確認單元測試覆蓋率達 80%+ (基本測試已建立，15 個測試通過)
- [x] 6.4 確認所有測試通過 (`pnpm test`)

## Dependencies

- Task 2 依賴 Task 1 (需要 Nuxt 專案才能設定資料庫)
- Task 3 依賴 Task 2 (需要資料庫連線才能建立 Schema)
- Task 4、5 依賴 Task 3 (需要 Schema 才能操作資料)
- Task 4.5 依賴 Task 4.4 與 Task 5.2 (登入後建立專案需要兩個功能)

## Parallelizable Work

- Task 4 與 Task 5 大部分可平行開發 (除 4.5 外)
- Task 6 需等待 Task 4、5 完成後進行

## 備註

### 本地開發環境

使用 Supabase CLI + Docker 進行本地開發：

```bash
# 啟動本地 Supabase
supabase start

# 停止本地 Supabase (資料會自動持久化)
supabase stop

# 推送 schema 變更
pnpm db:push

# 生成 migration 檔案
pnpm db:generate
```

- 本地資料庫 URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio 管理介面: http://127.0.0.1:54323
- Mailpit 郵件測試: http://127.0.0.1:54324
- 資料持久化: 存放在 Docker volumes，重啟後資料保留
