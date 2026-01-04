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

## 深入問題解答

### 🔗 Q1: Foreign Key 的 onDelete 選項詳解

**完整的 onDelete 選項:**

```typescript
// 1. CASCADE - 級聯刪除
.references(() => streamers.id, { onDelete: 'cascade' })
// 父資料刪除 → 子資料也刪除

// 2. SET NULL - 設為 NULL
.references(() => viewers.id, { onDelete: 'set null' })
// 父資料刪除 → 子資料的外鍵欄位設為 null

// 3. RESTRICT - 限制刪除 (預設)
.references(() => parent.id, { onDelete: 'restrict' })
// 如果有子資料存在,父資料無法刪除 (會報錯)

// 4. NO ACTION - 不採取動作
.references(() => parent.id, { onDelete: 'no action' })
// 類似 RESTRICT,但檢查時機不同 (延遲到交易結束)

// 5. SET DEFAULT - 設為預設值
.references(() => category.id, { onDelete: 'set default' })
// 父資料刪除 → 子資料的外鍵設為預設值
```

**實際範例對照:**

```typescript
// 範例 1: CASCADE (強依賴關係)
// 實況主被刪除,他的所有專案也應該被刪除
export const projects = pgTable('projects', {
  streamerId: uuid('streamer_id')
    .notNull()
    .references(() => streamers.id, { onDelete: 'cascade' }),
  // ...
})

// 範例 2: SET NULL (弱依賴關係)
// 觀眾被刪除,但問題仍保留 (變成完全匿名)
export const questions = pgTable('questions', {
  viewerId: uuid('viewer_id')
    .references(() => viewers.id, { onDelete: 'set null' }),
  // ...
})

// 範例 3: RESTRICT (保護資料)
// 如果分類下還有文章,不允許刪除分類
export const articles = pgTable('articles', {
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  // ...
})
```

**選擇指南:**

| onDelete 選項 | 使用時機 | 範例 |
|--------------|---------|------|
| `cascade` | 子資料完全依賴父資料 | streamer → projects |
| `set null` | 子資料可以獨立存在 | viewer → questions |
| `restrict` | 需要手動處理子資料才能刪除父資料 | category → articles |
| `no action` | 類似 restrict,但在交易結束時檢查 | 較少使用 |
| `set default` | 需要有備用的預設值 | 較少使用 |

**實際測試:**

```typescript
// 建立測試來理解 CASCADE
const db = useDb()

// 建立實況主和專案
const [streamer] = await db.insert(streamers).values({
  email: 'test@example.com',
}).returning()

const [project] = await db.insert(projects).values({
  streamerId: streamer.id,
  name: 'Test Project',
}).returning()

// 刪除實況主
await db.delete(streamers).where(eq(streamers.id, streamer.id))

// 查詢專案 → 會發現專案也被刪除了!
const foundProject = await db.query.projects.findFirst({
  where: eq(projects.id, project.id),
})
console.log(foundProject) // undefined (因為 CASCADE 刪除了)
```

---

### 📇 Q2: 索引 (Index) 深入解析

**索引是什麼?**

把索引想像成書本的「目錄」或「字典」:

- 沒有索引:要找「Apple」這個字,你要從第 1 頁翻到最後一頁
- 有索引:直接查目錄,跳到第 5 頁

**資料庫的索引運作原理:**

```
沒有索引的查詢:
┌────┬──────────┬───────────────┐
│ id │ email    │ display_name  │
├────┼──────────┼───────────────┤
│ 1  │ a@...    │ Alice         │  ← 逐行掃描
│ 2  │ b@...    │ Bob           │  ← 逐行掃描
│ 3  │ c@...    │ Charlie       │  ← 逐行掃描
│ ... (掃描 10000 筆)            │
│ 9999│sid@...  │ Sid           │  ← 找到了!
└────┴──────────┴───────────────┘
時間複雜度: O(n) - 線性搜尋

有索引的查詢:
email 索引 (B-Tree 結構)
        [m@...]
       /       \
    [e@...]   [s@...]
    /    \    /    \
 [a@...][h@...][n@...][sid@...] ← 直接跳到這裡!
 
時間複雜度: O(log n) - 對數搜尋
```

**具體數字對比:**

```
資料量: 1,000,000 筆

沒有索引:
- 平均需要掃描: 500,000 筆
- 耗時: ~500ms

有索引:
- 平均需要掃描: log₂(1,000,000) ≈ 20 層
- 耗時: ~1ms

速度提升: 500 倍!
```

**Drizzle 中建立索引的語法:**

```typescript
export const streamers = pgTable('streamers', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  country: varchar('country', { length: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // 單一欄位索引
  index('streamers_email_idx').on(table.email),
  index('streamers_slug_idx').on(table.slug),
  
  // 複合索引 (多個欄位)
  index('streamers_country_created_idx').on(table.country, table.createdAt),
  
  // 唯一索引 (UNIQUE)
  // .unique() 會自動建立唯一索引,不需要額外宣告
])
```

**索引的使用時機:**

✅ **應該建立索引:**

1. **WHERE 條件常用的欄位**

   ```typescript
   // 常查詢: WHERE email = ?
   index().on(table.email)
   ```

2. **JOIN 關聯的外鍵**

   ```typescript
   // 常 JOIN: projects JOIN streamers ON projects.streamer_id = streamers.id
   index().on(table.streamerId)
   ```

3. **ORDER BY 排序的欄位**

   ```typescript
   // 常排序: ORDER BY created_at DESC
   index().on(table.createdAt)
   ```

4. **UNIQUE 唯一性約束**

   ```typescript
   email: varchar('email').unique() // 自動建立唯一索引
   ```

❌ **不應該建立索引:**

1. 很少查詢的欄位
2. 資料重複率極高的欄位 (如 boolean)
3. 經常更新的欄位 (索引會降低寫入效能)
4. 小型資料表 (< 1000 筆)

**索引的代價:**

```typescript
// 優點:
✅ 大幅加速查詢 (SELECT)
✅ 加速排序 (ORDER BY)
✅ 加速 JOIN 操作

// 缺點:
❌ 增加儲存空間 (每個索引需要額外空間)
❌ 降低寫入速度 (INSERT, UPDATE, DELETE 時需要更新索引)
❌ 過多索引會讓查詢優化器困惑
```

**實際測試索引效能:**

```typescript
// server/api/_dev/index-test.get.ts
export default defineEventHandler(async (event) => {
  const db = useDb()
  
  // 1. 插入大量測試資料
  const testData = Array.from({ length: 10000 }, (_, i) => ({
    email: `test${i}@example.com`,
    slug: `test-${i}`,
    displayName: `Test User ${i}`,
  }))
  
  await db.insert(streamers).values(testData)
  
  // 2. 測試有索引的查詢 (email 有索引)
  console.time('查詢 (有索引)')
  await db.query.streamers.findFirst({
    where: eq(streamers.email, 'test9999@example.com'),
  })
  console.timeEnd('查詢 (有索引)') // ~1ms
  
  // 3. 測試沒索引的查詢 (displayName 沒索引)
  console.time('查詢 (無索引)')
  await db.query.streamers.findFirst({
    where: eq(streamers.displayName, 'Test User 9999'),
  })
  console.timeEnd('查詢 (無索引)') // ~50ms
  
  // 清理
  await db.delete(streamers).where(like(streamers.email, 'test%@example.com'))
  
  return { success: true }
})
```

---

### 🔄 Q3: Schema 與資料庫同步機制

**同步流程圖:**

```
1. 定義 Schema (TypeScript)
   ↓
2. 生成 Migration (SQL)
   ↓
3. 套用到資料庫
   ↓
4. 驗證一致性
```

**詳細步驟:**

**步驟 1: 修改 Schema**

```typescript
// server/database/schema/streamers.ts
export const streamers = pgTable('streamers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  bio: text('bio'), // 🆕 新增欄位
})
```

**步驟 2: 生成 Migration**

```bash
pnpm db:generate
```

這會生成一個新的 migration 檔案:

```sql
-- server/database/migrations/0003_xxx.sql
ALTER TABLE "streamers" ADD COLUMN "bio" text;
```

**步驟 3: 套用 Migration**

兩種方式:

```bash
# 開發環境 (直接同步,不保留歷史)
pnpm db:push

# 生產環境 (執行 migration 檔案,保留歷史)
pnpm db:migrate
```

**如果出現落差會怎樣?**

**情況 1: Schema 有,資料庫沒有 (最常見)**

```typescript
// Schema 定義了 bio 欄位
export const streamers = pgTable('streamers', {
  bio: text('bio'),
})

// 但資料庫還沒建立這個欄位
```

**結果:**

- 查詢時不會報錯,但 `bio` 永遠是 `undefined`
- 插入時會報錯: `column "bio" does not exist`

**解決方式:**

```bash
pnpm db:push  # 同步 schema 到資料庫
```

---

**情況 2: 資料庫有,Schema 沒有**

```sql
-- 資料庫有 old_column 欄位
ALTER TABLE streamers ADD COLUMN old_column text;
```

```typescript
// 但 Schema 中沒有定義
export const streamers = pgTable('streamers', {
  // 沒有 old_column
})
```

**結果:**

- Drizzle 會忽略這個欄位
- 不影響現有功能,但無法透過 Drizzle 操作這個欄位

**解決方式:**

```bash
# 如果要刪除資料庫中多餘的欄位
pnpm db:push  # Drizzle 會提示你刪除多餘欄位
```

---

**情況 3: 型別不一致**

```typescript
// Schema: varchar(100)
displayName: varchar('display_name', { length: 100 }),

// 資料庫: varchar(50)
```

**結果:**

- 可能導致資料截斷
- 可能導致驗證失敗

**解決方式:**

1. 修正 Schema
2. 重新生成 Migration
3. 套用 Migration

---

**如何確保一致性?**

**方法 1: 使用 Drizzle Kit 驗證**

```bash
# 檢查 Schema 與資料庫的差異
pnpm db:check

# 輸出範例:
# Warning: Column "bio" in table "streamers" is missing in database
```

**方法 2: 寫入檢查腳本**

```typescript
// scripts/check-db-sync.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/database/schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

async function checkSync() {
  try {
    // 嘗試查詢所有 schema 定義的欄位
    await db.query.streamers.findFirst()
    console.log('✅ Schema 與資料庫同步')
  } catch (error) {
    console.error('❌ Schema 與資料庫不同步:', error.message)
  }
}

checkSync()
```

**方法 3: CI/CD 自動檢查**

```yaml
# .github/workflows/check-db.yml
name: Check DB Sync
on: [push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm db:check
```

**最佳實踐:**

1. ✅ **永遠先修改 Schema,再生成 Migration**
2. ✅ **提交 Migration 檔案到版本控制**
3. ✅ **在生產環境使用 `db:migrate`,不要用 `db:push`**
4. ✅ **團隊協作時,先 pull 最新的 migration**
5. ❌ **不要手動修改資料庫結構**
6. ❌ **不要手動修改已經套用的 migration 檔案**

---

### 🏷️ Q4: 型別推導詳解

**`$inferSelect` vs `$inferInsert` 的差異:**

```typescript
export const streamers = pgTable('streamers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 50 }),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 讀取時的型別
export type Streamer = typeof streamers.$inferSelect
// 等同於:
type Streamer = {
  id: string                    // UUID
  email: string
  slug: string | null           // 可以是 null
  displayName: string | null
  createdAt: Date
  updatedAt: Date
}

// 新增時的型別
export type NewStreamer = typeof streamers.$inferInsert
// 等同於:
type NewStreamer = {
  id?: string                   // 可選 (有 defaultRandom)
  email: string                 // 必填
  slug?: string | null          // 可選
  displayName?: string | null   // 可選
  createdAt?: Date              // 可選 (有 defaultNow)
  updatedAt?: Date              // 可選 (有 defaultNow)
}
```

**區分邏輯:**

Drizzle 根據欄位的定義自動推導:

| 欄位定義 | $inferSelect | $inferInsert |
|---------|--------------|--------------|
| `.primaryKey().defaultRandom()` | 必定存在 | 可選 (自動生成) |
| `.defaultNow()` | 必定存在 | 可選 (自動生成) |
| `.notNull()` | 不可 null | 必填 |
| 沒有 `.notNull()` | 可以是 null | 可選 |
| `.default(value)` | 必定有值 | 可選 (有預設值) |

**實際使用範例:**

```typescript
// ✅ 正確的新增方式
const newStreamer: NewStreamer = {
  email: 'sid@example.com',
  // id, createdAt, updatedAt 會自動生成
  // slug, displayName 可以省略
}

await db.insert(streamers).values(newStreamer)

// ❌ 錯誤!缺少必填欄位
const invalid: NewStreamer = {
  // email 是必填的!
}

// ✅ 讀取時的型別
const streamer: Streamer | undefined = await db.query.streamers.findFirst({
  where: eq(streamers.email, 'sid@example.com'),
})

if (streamer) {
  console.log(streamer.id)        // string (一定存在)
  console.log(streamer.createdAt) // Date (一定存在)
  console.log(streamer.slug)      // string | null (可能不存在)
}
```

**進階:自訂型別**

```typescript
// 只選擇部分欄位
type StreamerBasic = Pick<Streamer, 'id' | 'email' | 'displayName'>

// 更新時的型別 (所有欄位都可選)
type UpdateStreamer = Partial<Streamer>

// API 回傳的型別 (排除敏感資訊)
type PublicStreamer = Omit<Streamer, 'email'>
```

---

### 🔗 Q5: 複合索引 (Composite Index)

**什麼是複合索引?**

在多個欄位上建立的索引,順序很重要!

**定義方式:**

```typescript
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // 複合索引:先按 projectId,再按 status
  index('idx_questions_project_status').on(table.projectId, table.status),
  
  // 單一索引
  index('idx_questions_created_at').on(table.createdAt),
])
```

**複合索引的運作原理:**

```
索引結構: (projectId, status)

索引樹:
  project-1
    ├─ pending (問題 1, 2, 3)
    ├─ visible (問題 4, 5)
    └─ hidden (問題 6)
  project-2
    ├─ pending (問題 7, 8)
    └─ visible (問題 9)
```

**哪些查詢可以使用這個索引?**

```typescript
// ✅ 可以使用索引 (完整匹配)
db.query.questions.findMany({
  where: and(
    eq(questions.projectId, 'xxx'),
    eq(questions.status, 'pending')
  )
})

// ✅ 可以使用索引 (左前綴匹配)
db.query.questions.findMany({
  where: eq(questions.projectId, 'xxx')
})

// ❌ 無法使用索引 (沒有左前綴)
db.query.questions.findMany({
  where: eq(questions.status, 'pending')
})
// 需要另外建立單獨的 status 索引
```

**左前綴規則 (Left-Prefix Rule):**

複合索引 `(A, B, C)` 可以加速:

- ✅ WHERE A = ?
- ✅ WHERE A = ? AND B = ?
- ✅ WHERE A = ? AND B = ? AND C = ?
- ❌ WHERE B = ?
- ❌ WHERE C = ?
- ❌ WHERE B = ? AND C = ?

**使用時機:**

```typescript
// 場景 1: 常一起查詢的欄位
// "取得某專案中所有待審核的問題"
index().on(table.projectId, table.status)

// 場景 2: 排序查詢
// "取得某專案的問題,按時間排序"
index().on(table.projectId, table.createdAt)

// 場景 3: 範圍查詢
// "取得某實況主在某時間範圍內的專案"
index().on(table.streamerId, table.createdAt)
```

**複合索引 vs 多個單一索引:**

```typescript
// 方案 A: 複合索引
index().on(table.projectId, table.status)

// 方案 B: 兩個單一索引
index().on(table.projectId)
index().on(table.status)
```

**比較:**

| 查詢類型 | 複合索引 | 多個單一索引 |
|---------|---------|-------------|
| WHERE projectId = ? AND status = ? | ⚡ 最快 | 🐌 需合併索引 |
| WHERE projectId = ? | ⚡ 快 | ⚡ 快 |
| WHERE status = ? | ❌ 無法使用 | ⚡ 快 |

**建議:**

- 如果兩個欄位總是一起查詢 → 複合索引
- 如果需要分別查詢 → 各自建立單一索引

---

### 🔗 Q6: Relations vs JOIN

**Relations 是什麼?**

Relations 是 Drizzle ORM 提供的**關聯定義**,不是 JOIN!

**定義 Relations:**

```typescript
// questions.ts
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

**Relations vs JOIN 的差別:**

| 特性 | Relations | JOIN |
|-----|-----------|------|
| 定義位置 | Schema 檔案中 | 查詢時動態指定 |
| 語法 | `with: { project: true }` | 手動寫 JOIN 條件 |
| 型別安全 | ✅ 完全型別安全 | ⚠️ 需要手動定義型別 |
| 易用性 | ⚡ 非常簡單 | 🔧 需要理解 SQL JOIN |
| 靈活性 | ⚠️ 僅限預定義的關聯 | ✅ 可以任意 JOIN |
| N+1 問題 | ✅ 自動優化 | ⚠️ 需要手動處理 |

**使用 Relations 的查詢:**

```typescript
// 使用 relations
const question = await db.query.questions.findFirst({
  where: eq(questions.id, 1),
  with: {
    project: true,  // 自動 JOIN projects
    viewer: true,   // 自動 JOIN viewers
  }
})

// 回傳的資料結構:
{
  id: 1,
  content: '這是問題',
  project: {
    id: 'xxx',
    name: '專案名稱',
    // ... 專案的所有欄位
  },
  viewer: {
    id: 'yyy',
    // ... 觀眾的所有欄位
  }
}

// 型別安全!
question.project.name  // ✅ TypeScript 知道這個欄位存在
```

**使用 JOIN 的查詢:**

```typescript
import { eq } from 'drizzle-orm'

// 手動 JOIN
const result = await db
  .select({
    questionId: questions.id,
    questionContent: questions.content,
    projectName: projects.name,
    viewerId: viewers.id,
  })
  .from(questions)
  .leftJoin(projects, eq(questions.projectId, projects.id))
  .leftJoin(viewers, eq(questions.viewerId, viewers.id))
  .where(eq(questions.id, 1))

// 回傳的資料結構:
[{
  questionId: 1,
  questionContent: '這是問題',
  projectName: '專案名稱',
  viewerId: 'yyy',
}]

// 需要手動定義型別
type QueryResult = {
  questionId: number
  questionContent: string
  projectName: string | null
  viewerId: string | null
}
```

**什麼時候用 Relations?什麼時候用 JOIN?**

**使用 Relations:**

- ✅ 標準的 1:N 或 N:1 關聯
- ✅ 需要完整的關聯資料
- ✅ 想要型別安全和簡潔的語法

**使用 JOIN:**

- ✅ 複雜的查詢條件
- ✅ 只需要部分欄位
- ✅ 多表聯合查詢
- ✅ 自訂查詢結果結構

**Relations 的 N+1 問題優化:**

```typescript
// ❌ N+1 問題 (沒有用 relations)
const allProjects = await db.query.projects.findMany()
for (const project of allProjects) {
  // 每個 project 都會執行一次查詢!總共 N+1 次查詢
  const questions = await db.query.questions.findMany({
    where: eq(questions.projectId, project.id)
  })
}

// ✅ 使用 relations 避免 N+1
const allProjects = await db.query.projects.findMany({
  with: {
    questions: true  // Drizzle 會自動優化成 1 次 JOIN 查詢
  }
})
```

**定義反向 Relations:**

```typescript
// projects.ts
export const projectsRelations = relations(projects, ({ one, many }) => ({
  // 1:1 關聯 - 專案屬於一個實況主
  streamer: one(streamers, {
    fields: [projects.streamerId],
    references: [streamers.id],
  }),
  // 1:N 關聯 - 專案有多個問題
  questions: many(questions),
}))

// 現在可以這樣查詢:
const project = await db.query.projects.findFirst({
  with: {
    streamer: true,   // 取得實況主資訊
    questions: true,  // 取得所有問題
  }
})
```

---

### ✅ Q7: Drizzle Schema vs Zod Schema

**關鍵差異:**

| 特性 | Drizzle Schema | Zod Schema |
|-----|----------------|------------|
| 用途 | 定義資料庫結構 | 驗證輸入資料 |
| 執行時機 | 資料庫層 | 應用層 |
| 驗證對象 | 資料庫操作 | HTTP 請求、API 輸入 |
| 錯誤訊息 | 資料庫錯誤 | 自訂友善訊息 |
| 型別推導 | ✅ | ✅ |

**為什麼需要兩者?**

```typescript
// 1️⃣ Drizzle Schema - 資料庫層面的約束
export const questions = pgTable('questions', {
  content: text('content').notNull(),  // 資料庫約束:不可為 null
})

// 2️⃣ Zod Schema - 應用層面的驗證
const schema = z.object({
  content: z
    .string()
    .min(10, '留言內容至少需要 10 個字')      // 業務邏輯
    .max(500, '留言內容不能超過 500 個字'),   // 業務邏輯
})
```

**防禦層次:**

```
用戶輸入
   ↓
┌─────────────────────────────┐
│ 第 1 層: Zod 驗證             │ ← 友善的錯誤訊息
│ - 檢查資料格式                 │    "留言至少需要 10 個字"
│ - 檢查業務邏輯                 │
│ - 轉換資料型別                 │
└─────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 第 2 層: Drizzle/資料庫約束    │ ← 技術性錯誤訊息
│ - 檢查 NOT NULL               │    "null value in column
│ - 檢查 UNIQUE                 │     'content' violates
│ - 檢查 FOREIGN KEY            │     not-null constraint"
└─────────────────────────────┘
   ↓
儲存到資料庫
```

**實際範例:**

```typescript
// server/api/questions/index.post.ts

// Zod Schema - 驗證前端送來的資料
const requestSchema = z.object({
  projectId: z.string().uuid('專案 ID 格式不正確'),
  content: z
    .string()
    .min(10, '留言內容至少需要 10 個字')
    .max(500, '留言內容不能超過 500 個字')
    .refine(
      (val) => !val.includes('髒話'),
      '內容不得包含不當言論'
    ),
  displayName: z.string().max(50).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 🛡️ 第一層防護: Zod 驗證
  const result = requestSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message,
      // 回傳: "留言內容至少需要 10 個字"
    })
  }
  
  const { projectId, content, displayName } = result.data
  const db = useDb()
  
  // 🛡️ 第二層防護: Drizzle/資料庫約束
  const [question] = await db.insert(questions).values({
    projectId,    // Drizzle 檢查: UUID 格式
    content,      // 資料庫檢查: NOT NULL
    displayName: displayName || generateAnonymousName(),
  }).returning()
  // 如果違反約束,會拋出資料庫錯誤
  
  return { question }
})
```

**Zod 可以做而 Drizzle 不能做的事:**

```typescript
const schema = z.object({
  email: z.string().email('Email 格式不正確'),
  
  password: z
    .string()
    .min(8, '密碼至少 8 個字')
    .regex(/[A-Z]/, '密碼必須包含大寫字母')
    .regex(/[0-9]/, '密碼必須包含數字'),
  
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '密碼與確認密碼不符',
    path: ['confirmPassword'],
  }
)
```

**Drizzle 可以做而 Zod 不能做的事:**

```typescript
export const users = pgTable('users', {
  email: varchar('email').unique(),  // 資料庫層面的唯一性約束
  
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // 複雜的資料庫約束
  check('email_or_deleted', sql`email IS NOT NULL OR deleted_at IS NOT NULL`),
])
```

**最佳實踐:**

1. ✅ **同時使用兩者**
   - Zod: 驗證用戶輸入,提供友善錯誤訊息
   - Drizzle: 確保資料庫完整性

2. ✅ **Zod 的驗證規則應該比 Drizzle 嚴格**

   ```typescript
   // Zod: 10-500 字
   content: z.string().min(10).max(500)
   
   // Drizzle: 只要求 notNull (更寬鬆)
   content: text('content').notNull()
   ```

3. ✅ **使用 Zod 處理業務邏輯驗證**

   ```typescript
   .refine(
     (val) => !blockedWords.some(word => val.includes(word)),
     '內容包含不當言論'
   )
   ```

4. ✅ **使用 Drizzle 確保資料完整性**

   ```typescript
   .references(() => projects.id)  // Foreign Key 約束
   .unique()                       // 唯一性約束
   ```

---

### 📝 Q8: Drizzle ORM 查詢語法完整指南

**基本查詢操作:**

#### 1. **查詢 (SELECT)**

```typescript
import { eq, and, or, like, gt, lt, inArray } from 'drizzle-orm'

// 查詢所有
const allStreamers = await db.query.streamers.findMany()

// 查詢第一筆
const streamer = await db.query.streamers.findFirst({
  where: eq(streamers.email, 'sid@example.com')
})

// 多條件查詢
const results = await db.query.questions.findMany({
  where: and(
    eq(questions.projectId, 'xxx'),
    eq(questions.status, 'pending'),
    gt(questions.createdAt, new Date('2026-01-01'))
  )
})

// OR 條件
const results = await db.query.questions.findMany({
  where: or(
    eq(questions.status, 'visible'),
    eq(questions.status, 'pending')
  )
})

// LIKE 模糊查詢
const results = await db.query.streamers.findMany({
  where: like(streamers.email, '%@gmail.com')
})

// IN 查詢
const results = await db.query.questions.findMany({
  where: inArray(questions.status, ['visible', 'pending'])
})
```

**SQL 對照表:**

| Drizzle | SQL | 範例 |
|---------|-----|------|
| `eq(field, value)` | `field = value` | `WHERE email = 'sid@example.com'` |
| `ne(field, value)` | `field != value` | `WHERE status != 'hidden'` |
| `gt(field, value)` | `field > value` | `WHERE id > 100` |
| `gte(field, value)` | `field >= value` | `WHERE id >= 100` |
| `lt(field, value)` | `field < value` | `WHERE id < 100` |
| `lte(field, value)` | `field <= value` | `WHERE id <= 100` |
| `like(field, pattern)` | `field LIKE pattern` | `WHERE email LIKE '%@gmail.com'` |
| `inArray(field, values)` | `field IN (values)` | `WHERE status IN ('visible', 'pending')` |
| `isNull(field)` | `field IS NULL` | `WHERE deleted_at IS NULL` |
| `isNotNull(field)` | `field IS NOT NULL` | `WHERE slug IS NOT NULL` |
| `and(...)` | `AND` | `WHERE a = 1 AND b = 2` |
| `or(...)` | `OR` | `WHERE a = 1 OR b = 2` |
| `not(condition)` | `NOT` | `WHERE NOT status = 'hidden'` |

#### 2. **新增 (INSERT)**

```typescript
// 新增單筆
const [newStreamer] = await db.insert(streamers).values({
  email: 'sid@example.com',
  slug: 'sid',
}).returning()

// 新增多筆
const newStreamers = await db.insert(streamers).values([
  { email: 'user1@example.com' },
  { email: 'user2@example.com' },
  { email: 'user3@example.com' },
]).returning()

// 衝突處理 (ON CONFLICT DO NOTHING)
await db.insert(streamers).values({
  email: 'sid@example.com',
}).onConflictDoNothing()

// 衝突時更新 (ON CONFLICT DO UPDATE)
await db.insert(streamers).values({
  email: 'sid@example.com',
  displayName: 'Sid',
}).onConflictDoUpdate({
  target: streamers.email,  // 衝突的欄位
  set: {
    displayName: 'Sid Updated',  // 更新的值
    updatedAt: sql`NOW()`,
  },
})
```

**SQL 對照:**

```typescript
// Drizzle
await db.insert(streamers).values({ email: 'sid@example.com' }).returning()

// SQL
INSERT INTO streamers (email) VALUES ('sid@example.com') RETURNING *;
```

#### 3. **更新 (UPDATE)**

```typescript
// 更新單筆
await db.update(streamers)
  .set({ displayName: 'New Name' })
  .where(eq(streamers.id, 'xxx'))

// 更新多筆
await db.update(questions)
  .set({ status: 'visible' })
  .where(eq(questions.projectId, 'xxx'))

// 使用 SQL 函式
await db.update(streamers)
  .set({ updatedAt: sql`NOW()` })
  .where(eq(streamers.id, 'xxx'))

// 返回更新後的資料
const [updatedStreamer] = await db.update(streamers)
  .set({ displayName: 'New Name' })
  .where(eq(streamers.id, 'xxx'))
  .returning()
```

**SQL 對照:**

```typescript
// Drizzle
await db.update(streamers)
  .set({ displayName: 'New Name' })
  .where(eq(streamers.id, 'xxx'))

// SQL
UPDATE streamers SET display_name = 'New Name' WHERE id = 'xxx';
```

#### 4. **刪除 (DELETE)**

```typescript
// 刪除單筆
await db.delete(streamers).where(eq(streamers.id, 'xxx'))

// 刪除多筆
await db.delete(questions).where(eq(questions.status, 'hidden'))

// 刪除所有 (危險!)
await db.delete(streamers)  // 會刪除整個表!

// 軟刪除 (推薦)
await db.update(streamers)
  .set({ deletedAt: sql`NOW()` })
  .where(eq(streamers.id, 'xxx'))
```

#### 5. **排序與分頁**

```typescript
import { desc, asc } from 'drizzle-orm'

// 排序
const results = await db.query.questions.findMany({
  orderBy: [desc(questions.createdAt)],  // 降序
})

// 多欄位排序
const results = await db.query.questions.findMany({
  orderBy: [
    desc(questions.status),  // 先按 status 降序
    asc(questions.createdAt),  // 再按 createdAt 升序
  ],
})

// 分頁
const results = await db.query.questions.findMany({
  limit: 10,   // 每頁 10 筆
  offset: 20,  // 跳過前 20 筆 (第 3 頁)
  orderBy: [desc(questions.createdAt)],
})

// 完整的分頁查詢
async function getQuestions(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize
  
  const [results, total] = await Promise.all([
    // 取得當頁資料
    db.query.questions.findMany({
      limit: pageSize,
      offset,
      orderBy: [desc(questions.createdAt)],
    }),
    // 取得總數
    db.select({ count: sql<number>`count(*)` }).from(questions),
  ])
  
  return {
    data: results,
    total: total[0].count,
    page,
    pageSize,
    totalPages: Math.ceil(total[0].count / pageSize),
  }
}
```

#### 6. **聚合查詢**

```typescript
import { count, sum, avg, min, max } from 'drizzle-orm'

// COUNT
const result = await db.select({ 
  count: count() 
}).from(questions)

// 帶條件的 COUNT
const result = await db.select({ 
  count: count() 
})
.from(questions)
.where(eq(questions.status, 'pending'))

// GROUP BY
const result = await db.select({
  projectId: questions.projectId,
  count: count(),
})
.from(questions)
.groupBy(questions.projectId)

// 多個聚合
const result = await db.select({
  projectId: questions.projectId,
  total: count(),
  pending: count(questions.id).where(eq(questions.status, 'pending')),
  visible: count(questions.id).where(eq(questions.status, 'visible')),
})
.from(questions)
.groupBy(questions.projectId)
```

#### 7. **JOIN 查詢**

```typescript
// LEFT JOIN
const result = await db.select({
  questionId: questions.id,
  questionContent: questions.content,
  projectName: projects.name,
})
.from(questions)
.leftJoin(projects, eq(questions.projectId, projects.id))

// INNER JOIN
const result = await db.select()
.from(questions)
.innerJoin(projects, eq(questions.projectId, projects.id))
.where(eq(projects.streamerId, 'xxx'))

// 多表 JOIN
const result = await db.select({
  questionId: questions.id,
  projectName: projects.name,
  streamerEmail: streamers.email,
})
.from(questions)
.innerJoin(projects, eq(questions.projectId, projects.id))
.innerJoin(streamers, eq(projects.streamerId, streamers.id))
```

**進階語法對照:**

```typescript
// Drizzle: 使用 Relations (推薦)
const question = await db.query.questions.findFirst({
  where: eq(questions.id, 1),
  with: {
    project: {
      with: {
        streamer: true  // 巢狀關聯
      }
    },
    viewer: true,
  }
})

// 等同的 SQL:
SELECT 
  q.*,
  p.*,
  s.*,
  v.*
FROM questions q
LEFT JOIN projects p ON q.project_id = p.id
LEFT JOIN streamers s ON p.streamer_id = s.id
LEFT JOIN viewers v ON q.viewer_id = v.id
WHERE q.id = 1
```

---

### 🏗️ Q9: Supabase 本地開發環境服務說明

**服務架構圖:**

```
┌─────────────────────────────────────────┐
│         Supabase Local Stack            │
├─────────────────────────────────────────┤
│ 🔧 Development Tools                    │
│ ├─ Studio (Port 54323)                  │  ← 資料庫管理介面
│ ├─ Mailpit (Port 54324)                 │  ← Email 測試工具
│ └─ MCP (Port 54321/mcp)                 │  ← Model Context Protocol
├─────────────────────────────────────────┤
│ 🌐 APIs                                 │
│ ├─ REST (Port 54321/rest/v1)            │  ← RESTful API
│ ├─ GraphQL (Port 54321/graphql/v1)      │  ← GraphQL API
│ └─ Edge Functions                       │  ← Serverless Functions
├─────────────────────────────────────────┤
│ ⛁ Database                              │
│ └─ PostgreSQL (Port 54322)              │  ← 資料庫
├─────────────────────────────────────────┤
│ 📦 Storage                              │
│ └─ S3-compatible (Port 54321/storage)   │  ← 檔案儲存
├─────────────────────────────────────────┤
│ 🔑 Auth                                 │
│ └─ GoTrue (內建)                        │  ← 驗證服務
├─────────────────────────────────────────┤
│ 🚫 Stopped Services (非必要)            │
│ ├─ imgproxy (圖片處理)                  │
│ └─ pooler (連線池)                      │
└─────────────────────────────────────────┘
```

**各服務詳細說明:**

#### 1. **Studio (Port 54323)** 🎨

**用途:** 資料庫視覺化管理介面

**功能:**

- 📊 瀏覽資料表和資料
- ✏️ 手動新增/編輯/刪除資料
- 🔍 執行 SQL 查詢
- 📈 查看資料庫統計
- 🔐 管理 RLS (Row Level Security) 政策
- 👥 管理使用者

**什麼時候用:**

- 查看資料庫中的實際資料
- 快速測試 SQL 查詢
- Debug 資料問題

**替代工具:**

- Drizzle Studio (專案使用)
- TablePlus
- pgAdmin

---

#### 2. **Mailpit (Port 54324)** 📧

**用途:** Email 測試工具

**功能:**

- ✉️ 捕獲所有發送的 email (不會真的寄出)
- 👀 預覽 email 內容 (HTML + 純文字)
- 🔍 搜尋 email
- 📎 查看附件

**使用場景:**

```typescript
// server/api/auth/magic-link.post.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'noreply@mallow-flow.com',
  to: 'user@example.com',
  subject: '登入驗證信',
  html: `<a href="${magicLink}">點擊登入</a>`,
})

// 在本地開發環境,這封信會被 Mailpit 捕獲
// 訪問 http://127.0.0.1:54324 查看
```

**優點:**

- 不需要真的 email 服務
- 可以測試所有 email 流程
- 避免發送垃圾郵件

---

#### 3. **MCP (Model Context Protocol)** 🤖

**用途:** AI 模型整合介面

**這是什麼:**

- Supabase 提供的 AI/ML 整合端點
- 可以讓你在 SQL 中使用 AI 功能

**使用範例:**

```sql
-- 使用 AI 生成 embedding (向量)
SELECT ai.embedding('text-embedding-ada-002', '這是一段文字')

-- 使用 AI 生成回覆
SELECT ai.completion('gpt-4', '寫一首詩')
```

**在這個專案中:**

- 目前未使用
- 未來可用於 Phase 4 (AI 分析功能)

---

#### 4. **REST API (Port 54321/rest/v1)** 🌐

**用途:** 自動生成的 RESTful API

**Supabase 會自動為每個資料表生成 CRUD API:**

```bash
# 查詢所有 streamers
GET http://127.0.0.1:54321/rest/v1/streamers

# 查詢單一 streamer
GET http://127.0.0.1:54321/rest/v1/streamers?id=eq.xxx

# 新增 streamer
POST http://127.0.0.1:54321/rest/v1/streamers
{
  "email": "test@example.com"
}

# 更新 streamer
PATCH http://127.0.0.1:54321/rest/v1/streamers?id=eq.xxx
{
  "displayName": "New Name"
}

# 刪除 streamer
DELETE http://127.0.0.1:54321/rest/v1/streamers?id=eq.xxx
```

**在這個專案中:**

- ❌ 不使用 Supabase REST API
- ✅ 使用 Nuxt API Routes (`server/api/`)
- 原因: 更好的型別安全和自訂邏輯

---

#### 5. **GraphQL API (Port 54321/graphql/v1)** 📊

**用途:** GraphQL 查詢介面

**範例:**

```graphql
query {
  streamers {
    id
    email
    projects {
      name
      questions {
        content
      }
    }
  }
}
```

**在這個專案中:**

- ❌ 不使用
- 原因: 專案採用 RESTful API 風格

---

#### 6. **Edge Functions** ⚡

**用途:** Serverless 函式

**類似:**

- Cloudflare Workers
- Vercel Edge Functions
- AWS Lambda@Edge

**在這個專案中:**

- ❌ 不使用 Supabase Edge Functions
- ✅ 使用 Nuxt Server Routes
- 原因: Nuxt 提供更好的整合

---

#### 7. **PostgreSQL (Port 54322)** 🗄️

**用途:** 實際的資料庫

**連線資訊:**

```
Host: 127.0.0.1
Port: 54322
Database: postgres
Username: postgres
Password: postgres
```

**在專案中的使用:**

```typescript
// .env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

// server/utils/db.ts
const client = postgres(process.env.DATABASE_URL!)
```

---

#### 8. **Storage (S3-compatible)** 📦

**用途:** 檔案儲存服務

**功能:**

- 上傳檔案 (圖片、影片、文件)
- S3 相容 API
- CDN 整合

**使用範例:**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseKey)

// 上傳檔案
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user-123.png', file)

// 取得公開 URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl('user-123.png')
```

**在這個專案中:**

- 未來可用於實況主頭像上傳
- Phase 6+ 功能

---

#### 9. **停用的服務**

**imgproxy** 🖼️

- 用途: 即時圖片處理 (裁切、縮放、格式轉換)
- 為何停用: 專案目前不需要圖片處理
- 啟用方式: `supabase start --with-imgproxy`

**pooler** 🔄

- 用途: PostgreSQL 連線池
- 為何停用: 本地開發不需要
- 生產環境會需要 (處理大量連線)

---

**如何使用這些服務?**

```bash
# 啟動所有服務
pnpm supabase:start

# 查看服務狀態
pnpm supabase:status

# 停止所有服務
pnpm supabase:stop

# 重置資料庫 (危險!會清空所有資料)
supabase db reset
```

**這個專案實際使用的 Supabase 功能:**

| 服務 | 使用狀態 | 用途 |
|-----|---------|------|
| PostgreSQL | ✅ 使用 | 資料庫 |
| Studio | ✅ 使用 | 查看資料 |
| Mailpit | ✅ 使用 | 測試 Magic Link |
| REST API | ❌ 不使用 | 用 Nuxt API |
| GraphQL | ❌ 不使用 | 用 Nuxt API |
| Edge Functions | ❌ 不使用 | 用 Nuxt Server |
| Storage | 🔜 未來使用 | 檔案上傳 |
| MCP | 🔜 未來使用 | AI 功能 |

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
