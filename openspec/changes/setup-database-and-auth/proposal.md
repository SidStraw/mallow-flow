# Change: 建立專案基礎設施與直播主驗證系統

## Why

Mallow Flow 專案目前缺乏基礎設施，需要初始化 Nuxt 4 專案、建立資料庫 Schema 與直播主驗證系統，作為後續功能開發的基礎。

## What Changes

- **專案初始化**: 使用 Nuxt 4 建立專案，設定 TailwindCSS、TypeScript Strict Mode、測試框架與程式碼品質工具
- **資料庫 Schema**: 使用 Drizzle ORM 定義 `streamers` 與 `projects` 表
- **直播主驗證系統**: 實作 Email Magic Link 登入，登入後自動建立預設專案
- **專案管理 API**: 提供專案 CRUD 操作的 RESTful API

## Impact

- **Affected specs**:
  - `database-schema` (新增)
  - `streamer-auth` (新增)
  - `project-management` (新增)
- **Affected code**:
  - `/nuxt.config.ts` - Nuxt 配置
  - `/server/database/schema/` - Drizzle Schema 定義
  - `/server/api/auth/` - 驗證 API
  - `/server/api/projects/` - 專案管理 API
  - `/package.json` - 專案依賴
