# Tasks: setup-database-and-auth

## 1. 專案初始化

- [ ] 1.1 使用 `nuxi init` 初始化 Nuxt 4 專案
- [ ] 1.2 設定 pnpm 為套件管理工具
- [ ] 1.3 安裝並設定 TailwindCSS + Nuxt UI
- [ ] 1.4 設定 TypeScript Strict Mode
- [ ] 1.5 安裝並設定 Prettier + ESLint (@nuxt/eslint)
- [ ] 1.6 安裝並設定 Vitest 測試框架
- [ ] 1.7 設定 Cloudflare Pages preset
- [ ] 1.8 驗證: `pnpm dev` 可正常啟動

## 2. 資料庫設定

- [ ] 2.1 安裝 Drizzle ORM 與 `postgres` driver
- [ ] 2.2 建立 Drizzle 設定檔 (`drizzle.config.ts`)
- [ ] 2.3 設定 Hyperdrive 連線配置
- [ ] 2.4 建立資料庫連線工具 (`server/utils/db.ts`)
- [ ] 2.5 驗證: 可成功連線至 PostgreSQL

## 3. Schema 定義

- [ ] 3.1 建立 `streamers` 表 Schema
- [ ] 3.2 建立 `projects` 表 Schema
- [ ] 3.3 產生 Drizzle Migrations (`pnpm db:generate`)
- [ ] 3.4 執行 Migrations (`pnpm db:migrate`)
- [ ] 3.5 驗證: Schema 正確建立於資料庫

## 4. 驗證系統

- [ ] 4.1 安裝 Nuxt Auth Utils
- [ ] 4.2 設定 Resend 郵件服務
- [ ] 4.3 實作 Magic Link 發送 API (`POST /api/auth/magic-link`)
- [ ] 4.4 實作 Magic Link 驗證 API (`GET /api/auth/verify`)
- [ ] 4.5 實作登入後自動建立預設專案邏輯
- [ ] 4.6 實作登出 API (`POST /api/auth/logout`)
- [ ] 4.7 實作取得當前使用者 API (`GET /api/auth/me`)
- [ ] 4.8 撰寫驗證流程單元測試
- [ ] 4.9 驗證: Magic Link 完整登入流程可運作

## 5. 專案管理 API

- [ ] 5.1 實作列出專案 API (`GET /api/projects`)
- [ ] 5.2 實作建立專案 API (`POST /api/projects`)
- [ ] 5.3 實作更新專案 API (`PUT /api/projects/:id`)
- [ ] 5.4 實作刪除專案 API (`DELETE /api/projects/:id`)
- [ ] 5.5 實作專案驗證中介層 (確認專案所有權)
- [ ] 5.6 撰寫專案 API 整合測試
- [ ] 5.7 驗證: 專案 CRUD 功能正常運作

## 6. 品質確認

- [ ] 6.1 執行 TypeScript 型別檢查 (`pnpm typecheck`)
- [ ] 6.2 執行 ESLint 檢查 (`pnpm lint`)
- [ ] 6.3 確認單元測試覆蓋率達 80%+
- [ ] 6.4 確認所有測試通過 (`pnpm test`)

## Dependencies

- Task 2 依賴 Task 1 (需要 Nuxt 專案才能設定資料庫)
- Task 3 依賴 Task 2 (需要資料庫連線才能建立 Schema)
- Task 4、5 依賴 Task 3 (需要 Schema 才能操作資料)
- Task 4.5 依賴 Task 4.4 與 Task 5.2 (登入後建立專案需要兩個功能)

## Parallelizable Work

- Task 4 與 Task 5 大部分可平行開發 (除 4.5 外)
- Task 6 需等待 Task 4、5 完成後進行
