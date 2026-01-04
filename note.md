# Mallow Flow 後端技術導讀筆記

> 本文件記錄後端技術架構的學習過程與實驗練習
>
> 最後更新:2026年1月4日

---

## 📚 目錄

1. [技術棧概覽](#技術棧概覽)
2. [核心概念介紹](#核心概念介紹)
3. [資料庫架構解析](#資料庫架構解析)
4. [API 設計模式](#api-設計模式)
5. [實驗練習](#實驗練習)
6. [常見問題與解決方案](#常見問題與解決方案)

---

## 技術棧概覽

### 🎯 這個專案使用的技術

```
前端框架: Nuxt 4 (基於 Vue 3)
後端運行時: Nitro (Nuxt 的伺服器引擎)
資料庫: PostgreSQL
ORM: Drizzle ORM
驗證: nuxt-auth-utils
資料驗證: Zod
Email: Resend
部署目標: Cloudflare Pages
```

### 🤔 為什麼選擇這些技術?

#### 1. **Nuxt 4 - 全端框架**

- **對前端工程師友善**: 你已經熟悉 Vue,Nuxt 讓你可以用相同的知識寫後端
- **檔案系統路由**: `server/api/` 資料夾中的檔案自動變成 API 路由
- **型別安全**: TypeScript 從前端到後端都有完整支援

#### 2. **Drizzle ORM - 資料庫 ORM**

- **TypeScript First**: 完全用 TypeScript 定義資料庫結構
- **型別推導**: 自動生成型別,不需要手動維護
- **SQL-like**: 語法接近 SQL,學習曲線較低
- **輕量**: 比其他 ORM (如 Prisma) 更輕量,適合 Edge 環境

#### 3. **PostgreSQL - 關聯式資料庫**

- **可靠性**: 業界標準,成熟穩定
- **功能完整**: 支援複雜查詢、交易、索引等
- **Supabase**: 本地開發使用 Supabase,提供完整的 PostgreSQL 環境

#### 4. **Cloudflare Pages - 邊緣部署**

- **全球 CDN**: 在全球各地都有快速的回應速度
- **Serverless**: 不需要管理伺服器
- **限制**: 因為是 Edge 環境,有一些限制 (如不支援 prepared statements)

---

## 核心概念介紹

### 🗄️ 什麼是 ORM?

**ORM = Object-Relational Mapping (物件關聯映射)**

簡單來說:

- **沒有 ORM**: 你要寫 SQL 字串來操作資料庫
- **有 ORM**: 你用物件和方法來操作資料庫

#### 傳統方式 (沒有 ORM)

```javascript
// ❌ 容易出錯、難以維護、沒有型別安全
const result = await db.query(
  "SELECT * FROM streamers WHERE email = $1",
  [email]
)
```

#### 使用 Drizzle ORM

```typescript
// ✅ 型別安全、容易理解、IDE 自動補全
const streamer = await db.query.streamers.findFirst({
  where: eq(streamers.email, email)
})
```

### 📊 資料庫基本概念

#### 1. **Table (資料表)**

就像 Excel 的工作表,存放一類資料

#### 2. **Column (欄位)**

表格的直行,定義資料的屬性

#### 3. **Row (資料列)**

表格的橫列,一筆實際的資料

#### 4. **Primary Key (主鍵)**

唯一識別每一筆資料的欄位

#### 5. **Foreign Key (外鍵)**

關聯到另一個表格的欄位

#### 6. **Index (索引)**

加速查詢的資料結構

#### 實際範例

```
streamers 資料表
┌──────────────────────────────────┬─────────────────┬──────────┬──────────────┐
│ id (Primary Key)                 │ email           │ slug     │ display_name │
├──────────────────────────────────┼─────────────────┼──────────┼──────────────┤
│ 550e8400-e29b-41d4-a716-4466... │ sid@example.com │ sid      │ Sid          │
│ 6ba7b810-9dad-11d1-80b4-0080... │ joe@example.com │ joe      │ Joe          │
└──────────────────────────────────┴─────────────────┴──────────┴──────────────┘
```

---

## 資料庫架構解析

### 🏗️ Schema 定義

在這個專案中,所有資料表的定義都在 `server/database/schema/` 資料夾:

```
server/database/schema/
├── index.ts          # 匯出所有 schema
├── streamers.ts      # 實況主資料表
├── projects.ts       # 專案資料表
├── questions.ts      # 問題資料表
└── viewers.ts        # 觀眾資料表
```

### 📋 資料表關係圖

```
streamers (實況主)
    │
    │ 1 streamer : N projects
    ↓
projects (專案)
    │
    │ 1 project : N questions
    ↓
questions (問題) ← viewers (觀眾)
                   1 viewer : N questions
```

### 🔍 詳細解析每個 Schema

#### 1. Streamers (實況主)

```typescript
export const streamers = pgTable('streamers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('streamers_email_idx').on(table.email),
  index('streamers_slug_idx').on(table.slug),
])
```

**逐行解析:**

- `pgTable('streamers', { ... })`: 建立名為 `streamers` 的 PostgreSQL 資料表
- `id: uuid('id').primaryKey().defaultRandom()`:
  - 欄位名稱為 `id`
  - 型別是 UUID (通用唯一識別碼)
  - 設為主鍵 (Primary Key)
  - 自動生成隨機值
  
- `email: varchar('email', { length: 255 }).notNull().unique()`:
  - 型別是 varchar (可變長度字串),最大 255 字元
  - `.notNull()`: 不可為空
  - `.unique()`: 必須唯一 (不能有兩個相同的 email)
  
- `slug: varchar('slug', { length: 50 }).unique()`:
  - 實況主的專屬網址,如 `mallow-flow.com/u/sid`
  - 可以是 null (允許實況主還沒設定)
  - 但如果設定了,必須是唯一的

- `timestamp('created_at', { withTimezone: true }).notNull().defaultNow()`:
  - 記錄建立時間
  - `withTimezone`: 儲存時區資訊
  - `defaultNow()`: 建立時自動設為當下時間

- **索引 (Index)**:

  ```typescript
  index('streamers_email_idx').on(table.email),
  index('streamers_slug_idx').on(table.slug),
  ```

  - 為什麼需要索引? 就像書的目錄,可以快速找到資料
  - 在 `email` 和 `slug` 上建立索引,因為我們常用這兩個欄位來查詢

**型別推導:**

```typescript
export type Streamer = typeof streamers.$inferSelect
export type NewStreamer = typeof streamers.$inferInsert
```

- `Streamer`: 從資料庫讀取時的型別
- `NewStreamer`: 新增資料時的型別 (某些欄位可以省略,如 `id`, `createdAt`)

#### 2. Projects (專案)

```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  streamerId: uuid('streamer_id').notNull().references(() => streamers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('projects_streamer_id_idx').on(table.streamerId),
])
```

**重點解析:**

- `streamerId: uuid('streamer_id').notNull().references(() => streamers.id, { onDelete: 'cascade' })`:
  - **Foreign Key (外鍵)**: 關聯到 `streamers.id`
  - `.references(() => streamers.id)`: 這個欄位的值必須存在於 `streamers.id` 中
  - `{ onDelete: 'cascade' }`: **重要!** 當實況主被刪除時,他的所有專案也會被刪除
  
- `isDefault: boolean('is_default').notNull().default(false)`:
  - 是否為預設專案
  - 預設值為 `false`

**關聯 (Relationship) 的意義:**

```
Streamer (id: 123) ──┐
                     ├─→ Project (id: 456, streamerId: 123)
                     ├─→ Project (id: 789, streamerId: 123)
                     └─→ Project (id: 101, streamerId: 123)
```

一個實況主可以有多個專案,但每個專案只屬於一個實況主。

#### 3. Questions (問題)

```typescript
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  viewerId: uuid('viewer_id').references(() => viewers.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'visible', 'hidden'] }).notNull().default('pending'),
  isHiddenByStreamer: boolean('is_hidden_by_streamer').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_questions_project_status').on(table.projectId, table.status),
  index('idx_questions_created_at').on(table.createdAt),
])
```

**重點解析:**

- `id: serial('id').primaryKey()`:
  - `serial`: 自動遞增的整數 (1, 2, 3, ...)
  - 比 UUID 更適合作為問題的 ID,因為數字更好記
  
- `viewerId: uuid('viewer_id').references(() => viewers.id, { onDelete: 'set null' })`:
  - 可以是 null (匿名問題)
  - `{ onDelete: 'set null' }`: 當觀眾被刪除時,這個欄位設為 null (而不是刪除問題)

- `status: text('status', { enum: ['pending', 'visible', 'hidden'] })`:
  - **Enum**: 限定只能是這三個值之一
  - `pending`: 待審核
  - `visible`: 已顯示
  - `hidden`: 已隱藏

- **複合索引**:

  ```typescript
  index('idx_questions_project_status').on(table.projectId, table.status)
  ```

  - 同時在 `projectId` 和 `status` 上建立索引
  - 適合查詢「某專案中的所有待審核問題」這類請求

**Drizzle Relations:**

```typescript
export const questionsRelations = relations(questions, ({ one }) => ({
  project: one(projects, {
    fields: [questions.projectId],
    references: [projects.id],
  }),
  viewer: one(viewers, {
    fields: [questions.viewerId],
    references: [viewers.id],
  }),
}))
```

這段定義了 questions 與其他表的關聯,讓你可以這樣查詢:

```typescript
// 查詢問題時,一併取得專案資訊
const question = await db.query.questions.findFirst({
  where: eq(questions.id, 1),
  with: {
    project: true,  // 自動 JOIN 專案資料
    viewer: true,   // 自動 JOIN 觀眾資料
  }
})
```

#### 4. Viewers (觀眾)

```typescript
export const viewers = pgTable('viewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**設計理念:**

- **極簡設計**: 只有 `id` 和 `createdAt`
- **為什麼?** 觀眾是匿名的,我們只需要追蹤他們的 ID
- **未來擴展**: 如果需要更多資訊 (如暱稱、頭像),可以在這裡新增欄位

---

## API 設計模式

### 📁 檔案系統路由

Nuxt 的 `server/api/` 資料夾中的檔案會自動變成 API 路由:

```
server/api/
├── questions/
│   ├── index.post.ts       → POST /api/questions
│   └── [id]/
│       ├── index.get.ts    → GET /api/questions/:id
│       └── index.delete.ts → DELETE /api/questions/:id
├── projects/
│   ├── index.get.ts        → GET /api/projects
│   ├── index.post.ts       → POST /api/projects
│   ├── [id].put.ts         → PUT /api/projects/:id
│   └── [id].delete.ts      → DELETE /api/projects/:id
└── streamers/
    └── [slug].get.ts       → GET /api/streamers/:slug
```

**命名規則:**

- `index.post.ts`: 對應 POST 方法
- `index.get.ts`: 對應 GET 方法
- `[id].put.ts`: `[id]` 是動態參數,對應 PUT 方法

### 🔍 API 實作範例解析

讓我們深入解析 `server/api/questions/index.post.ts`:

```typescript
import { z } from 'zod/v4'
import { eq } from 'drizzle-orm'
import { questions, projects } from '../../database/schema'
import { generateAnonymousName } from '../../utils/anonymous-name'
import { checkRateLimit, getClientIp } from '../../utils/rate-limit'

// 1. 定義資料驗證 Schema
const schema = z.object({
  projectId: z.string().uuid('專案 ID 格式不正確'),
  content: z
    .string()
    .min(10, '留言內容至少需要 10 個字')
    .max(500, '留言內容不能超過 500 個字'),
  displayName: z.string().max(50, '暱稱不能超過 50 個字').optional(),
})

export default defineEventHandler(async (event) => {
  // 2. Rate limiting (防止濫用)
  const ip = getClientIp(event)
  const rateLimit = checkRateLimit(ip)

  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: '投稿太頻繁,請稍後再試',
    })
  }

  // 3. 解析並驗證請求內容
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '驗證失敗',
    })
  }

  const { projectId, content, displayName } = result.data
  const db = useDb()

  // 4. 驗證專案是否存在
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: '專案不存在',
    })
  }

  // 5. 建立問題
  const [question] = await db.insert(questions).values({
    projectId,
    content,
    displayName: displayName || generateAnonymousName(),
    status: 'pending',
  }).returning()

  // 6. 回傳結果
  setResponseStatus(event, 201)
  return { question }
})
```

**逐步解析:**

#### 步驟 1: Zod 資料驗證

```typescript
const schema = z.object({
  projectId: z.string().uuid('專案 ID 格式不正確'),
  content: z.string().min(10).max(500),
  displayName: z.string().max(50).optional(),
})
```

**Zod 是什麼?**

- 資料驗證函式庫
- 確保前端傳來的資料符合預期格式
- 自動生成 TypeScript 型別

**為什麼需要驗證?**

- 防止惡意輸入
- 確保資料品質
- 提供清楚的錯誤訊息

#### 步驟 2: Rate Limiting

```typescript
const ip = getClientIp(event)
const rateLimit = checkRateLimit(ip)
```

**為什麼需要 Rate Limiting?**

- 防止同一個 IP 短時間內發送大量請求
- 避免惡意攻擊或濫用

#### 步驟 3: 使用 Drizzle ORM 查詢

```typescript
// 查詢專案是否存在
const project = await db.query.projects.findFirst({
  where: eq(projects.id, projectId),
})
```

**Drizzle 查詢語法:**

- `db.query.projects`: 查詢 projects 資料表
- `.findFirst()`: 找第一筆符合的資料
- `where: eq(projects.id, projectId)`: WHERE 條件 (`eq` = equal)

**等同的 SQL:**

```sql
SELECT * FROM projects WHERE id = $projectId LIMIT 1;
```

#### 步驟 4: 新增資料

```typescript
const [question] = await db.insert(questions).values({
  projectId,
  content,
  displayName: displayName || generateAnonymousName(),
  status: 'pending',
}).returning()
```

**Drizzle 新增語法:**

- `db.insert(questions)`: 插入到 questions 資料表
- `.values({ ... })`: 要插入的資料
- `.returning()`: 回傳新增的資料 (包含自動生成的 `id`, `createdAt` 等)

**等同的 SQL:**

```sql
INSERT INTO questions (project_id, content, display_name, status)
VALUES ($projectId, $content, $displayName, 'pending')
RETURNING *;
```

**解構賦值 `[question]`:**

- `returning()` 回傳一個陣列
- 用 `[question]` 取得第一個元素

---

## 實驗練習

### 🧪 練習 1: 本地啟動資料庫

**目標:** 理解如何在本地運行 PostgreSQL

**步驟:**

1. 確保已安裝 Supabase CLI

   ```bash
   # 檢查版本
   supabase --version
   ```

2. 啟動 Supabase 本地實例

   ```bash
   pnpm supabase:start
   ```

3. 你應該會看到類似這樣的輸出:

   ```
   Started supabase local development setup.
   
   API URL: http://127.0.0.1:54321
   DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
   Studio URL: http://127.0.0.1:54323
   ```

4. 打開 Drizzle Studio 查看資料庫

   ```bash
   pnpm db:studio
   ```

**實驗:**

- 在 Drizzle Studio 中瀏覽各個資料表
- 嘗試手動新增一筆 streamer 資料
- 觀察主鍵 (id) 是如何自動生成的

---

### 🧪 練習 2: 理解 Migration (資料庫遷移)

**什麼是 Migration?**

Migration 就像是資料庫的「版本控制」:

- 記錄資料庫結構的每一次改變
- 可以套用 (apply) 或回退 (revert) 變更
- 確保團隊成員的資料庫結構一致

**查看 Migration 檔案:**

```bash
ls server/database/migrations/
```

你會看到:

```
0000_sturdy_the_liberteens.sql
0001_naive_wiccan.sql
0002_open_tag.sql
```

**打開第一個 Migration 檔案:**

```sql
-- 0000_sturdy_the_liberteens.sql
CREATE TABLE IF NOT EXISTS "streamers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "slug" varchar(50) UNIQUE,
  -- ... 其他欄位
);

CREATE INDEX IF NOT EXISTS "streamers_email_idx" ON "streamers" ("email");
-- ... 其他索引
```

**實驗:**

1. 修改 schema (例如在 `streamers` 中新增一個欄位):

   ```typescript
   // server/database/schema/streamers.ts
   export const streamers = pgTable('streamers', {
     // ... 現有欄位
     bio: text('bio'), // 新增傳記欄位
   })
   ```

2. 生成新的 migration:

   ```bash
   pnpm db:generate
   ```

3. 查看新生成的 migration 檔案

4. 套用 migration:

   ```bash
   pnpm db:push
   ```

5. 在 Drizzle Studio 中確認欄位已新增

6. **復原變更** (練習完後):
   - 刪除剛才新增的 migration 檔案
   - 從 schema 中移除 `bio` 欄位
   - 執行 `pnpm db:push`

---

### 🧪 練習 3: CRUD 操作實驗

**建立一個測試 API 來練習資料庫操作**

建立檔案: `server/api/_dev/db-test.get.ts`

```typescript
import { eq } from 'drizzle-orm'
import { streamers } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  
  // CREATE - 建立
  const [newStreamer] = await db.insert(streamers).values({
    email: 'test@example.com',
    slug: 'test-user',
    displayName: 'Test User',
  }).returning()
  
  console.log('✅ 建立成功:', newStreamer)
  
  // READ - 讀取
  const foundStreamer = await db.query.streamers.findFirst({
    where: eq(streamers.email, 'test@example.com')
  })
  
  console.log('✅ 查詢成功:', foundStreamer)
  
  // UPDATE - 更新
  const [updatedStreamer] = await db
    .update(streamers)
    .set({ displayName: 'Updated Name' })
    .where(eq(streamers.id, newStreamer.id))
    .returning()
  
  console.log('✅ 更新成功:', updatedStreamer)
  
  // DELETE - 刪除
  await db.delete(streamers).where(eq(streamers.id, newStreamer.id))
  
  console.log('✅ 刪除成功')
  
  return { success: true }
})
```

**執行實驗:**

1. 啟動開發伺服器:

   ```bash
   pnpm dev
   ```

2. 訪問 <http://localhost:3000/api/_dev/db-test>

3. 查看終端機的 console.log 輸出

4. 在 Drizzle Studio 中觀察資料變化

**進階練習:**

嘗試修改程式碼,練習:

- 一次建立多筆資料
- 使用不同的查詢條件
- 複合查詢 (JOIN)

---

### 🧪 練習 4: 理解關聯查詢

**建立測試檔案:** `server/api/_dev/relations-test.get.ts`

```typescript
import { eq } from 'drizzle-orm'
import { streamers, projects, questions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  
  // 1. 建立測試資料
  const [streamer] = await db.insert(streamers).values({
    email: 'relations-test@example.com',
    slug: 'relations-test',
    displayName: 'Relations Test',
  }).returning()
  
  const [project] = await db.insert(projects).values({
    streamerId: streamer.id,
    name: 'Test Project',
  }).returning()
  
  const [question] = await db.insert(questions).values({
    projectId: project.id,
    content: 'This is a test question with at least 10 characters',
    displayName: 'Anonymous',
  }).returning()
  
  // 2. 查詢問題時,一併取得專案和實況主資訊
  const questionWithRelations = await db.query.questions.findFirst({
    where: eq(questions.id, question.id),
    with: {
      project: true,  // 關聯 project
    }
  })
  
  console.log('問題 + 專案:', questionWithRelations)
  
  // 3. 清理測試資料
  await db.delete(streamers).where(eq(streamers.id, streamer.id))
  
  return { questionWithRelations }
})
```

**實驗:**

1. 訪問 <http://localhost:3000/api/_dev/relations-test>
2. 觀察回傳的資料結構
3. 注意 `project` 是如何自動 JOIN 進來的

**思考:**

- 如果沒有定義 relations,會發生什麼?
- CASCADE DELETE 如何運作? (刪除 streamer 時,project 和 question 都會被刪除)

---

## 常見問題與解決方案

### ❓ Q1: 為什麼要用 UUID 而不是自增 ID?

**A:**

- **UUID**: 全域唯一,分散式系統友善,難以猜測
- **自增 ID**: 簡單,連續,但可能洩漏資訊量 (如第 100 個用戶)

**使用原則:**

- 使用者相關資料 (streamers, viewers): UUID
- 內部資料 (questions): 可用自增 ID

### ❓ Q2: onDelete: 'cascade' vs 'set null' 的差別?

**A:**

```typescript
// CASCADE: 父資料被刪除時,子資料也刪除
streamerId: uuid('streamer_id')
  .references(() => streamers.id, { onDelete: 'cascade' })
// 當 streamer 被刪除 → 所有 projects 也被刪除

// SET NULL: 父資料被刪除時,子資料的外鍵設為 null
viewerId: uuid('viewer_id')
  .references(() => viewers.id, { onDelete: 'set null' })
// 當 viewer 被刪除 → question 保留,但 viewerId 變成 null
```

**選擇原則:**

- 強依賴關係: CASCADE (如 project 依賴 streamer)
- 弱依賴關係: SET NULL (如 question 可以沒有 viewer)

### ❓ Q3: 什麼時候需要建立索引?

**A:**

建立索引的時機:

- ✅ 經常用於 WHERE 條件的欄位
- ✅ 經常用於 JOIN 的欄位
- ✅ UNIQUE 欄位 (email, slug)
- ❌ 很少查詢的欄位
- ❌ 經常更新的欄位 (索引會降低寫入效能)

### ❓ Q4: 如何處理資料庫錯誤?

**A:**

```typescript
try {
  await db.insert(streamers).values({
    email: 'duplicate@example.com',
  })
} catch (error) {
  // Unique constraint violation
  if (error.code === '23505') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email 已被使用',
    })
  }
  throw error
}
```

**常見錯誤碼:**

- `23505`: UNIQUE 違反
- `23503`: FOREIGN KEY 違反
- `23502`: NOT NULL 違反

### ❓ Q5: 如何進行資料庫遷移 (Migration)?

**A:**

**開發流程:**

1. 修改 schema 檔案
2. 生成 migration: `pnpm db:generate`
3. 檢查生成的 SQL 檔案
4. 套用 migration: `pnpm db:migrate` (生產環境) 或 `pnpm db:push` (開發環境)

**`db:push` vs `db:migrate` 的差別:**

- `db:push`: 直接同步 schema 到資料庫,不保留 migration 歷史 (開發用)
- `db:migrate`: 執行 migration 檔案,保留完整歷史 (生產用)

---

## 下一步學習計劃

### 📖 階段 1: 基礎掌握 (當前階段) ✓

- ✅ 理解專案技術棧
- ✅ 了解資料庫基本概念
- ✅ 熟悉 Drizzle ORM 語法
- ✅ 理解 API 設計模式

### 📖 階段 2: 實戰演練

- [ ] 實作一個完整的 CRUD API
- [ ] 處理複雜查詢 (JOIN, WHERE, ORDER BY)
- [ ] 實作資料驗證與錯誤處理
- [ ] 撰寫測試

### 📖 階段 3: 進階主題

- [ ] 交易 (Transactions)
- [ ] 效能優化 (N+1 問題)
- [ ] 資料庫索引策略
- [ ] 備份與復原

---

## 學習資源

### 📚 官方文件

- [Drizzle ORM 文件](https://orm.drizzle.team/docs/overview)
- [Nuxt 3 文件](https://nuxt.com/docs)
- [PostgreSQL 教學](https://www.postgresql.org/docs/)

### 🎥 推薦影片

- [Drizzle ORM Crash Course](https://www.youtube.com/results?search_query=drizzle+orm+tutorial)
- [SQL 基礎教學](https://www.youtube.com/results?search_query=sql+tutorial)

### 🛠️ 工具

- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) - 資料庫 GUI
- [TablePlus](https://tableplus.com/) - 資料庫管理工具
- [Supabase](https://supabase.com/) - PostgreSQL 雲端服務

---
