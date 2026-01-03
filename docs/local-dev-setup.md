# Supabase 本地開發設定指南

## 安裝 Supabase CLI

```bash
# macOS (推薦)
brew install supabase/tap/supabase
```

## 啟動本地開發環境

```bash
# 啟動本地 Supabase (需要 Docker)
supabase start
```

啟動後會顯示：
- **Studio URL**: http://127.0.0.1:54323 (管理介面)
- **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Mailpit URL**: http://127.0.0.1:54324 (郵件測試)

## 環境變數

專案已建立 `.env.local` (已在 .gitignore 中忽略)：

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NUXT_SESSION_SECRET=local-dev-secret-at-least-32-characters-long
RESEND_API_KEY=re_dummy_key_for_local_dev
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

## 日常開發流程

```bash
# 1. 啟動 Supabase
supabase start

# 2. 啟動 Nuxt dev server
pnpm dev

# 3. 開發完成後停止 Supabase
supabase stop
```

## 資料庫操作

```bash
# 推送 schema 變更到本地資料庫 (開發時推薦)
pnpm db:push

# 生成 migration 檔案 (正式版本控制)
pnpm db:generate

# 打開 Drizzle Studio (資料庫 GUI)
pnpm db:studio
```

## 測試郵件功能

本地開發時，所有郵件會被 Mailpit 攔截：
- 訪問 http://127.0.0.1:54324
- 測試 Magic Link 時可以在這裡查看郵件內容

## 資料持久化

✅ **資料會自動持久化！**

- Supabase CLI 使用 Docker volumes 存放資料
- `supabase stop` 後資料不會遺失
- `supabase start` 會從備份恢復資料

查看資料 volumes：
```bash
docker volume ls --filter label=com.supabase.cli.project=mallow-flow
```

## 資料庫重置

如果需要完全重置資料庫：
```bash
# 重置資料庫 (會執行 seed.sql)
supabase db reset

# 或直接重新推送 schema
pnpm db:push
```

## 常用指令

| 指令 | 說明 |
|------|------|
| `supabase start` | 啟動本地 Supabase |
| `supabase stop` | 停止本地 Supabase (保留資料) |
| `supabase status` | 查看服務狀態 |
| `supabase db reset` | 重置資料庫 |
| `pnpm db:push` | 推送 schema 變更 |
| `pnpm db:generate` | 生成 migration |
| `pnpm db:studio` | 打開 Drizzle Studio |

