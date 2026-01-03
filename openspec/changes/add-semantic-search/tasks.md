# Tasks: add-semantic-search

## 1. Database Schema 擴充

- [ ] 1.1 建立 pgvector extension migration
- [ ] 1.2 新增 `Questions.embedding` 欄位 (Vector(1536), nullable)
- [ ] 1.3 建立 IVFFlat 索引 (lists = 100)
- [ ] 1.4 更新 Drizzle schema 定義

## 2. Embedding 服務實作

- [ ] 2.1 建立 `server/services/embedding.ts` - OpenAI embedding API 封裝
- [ ] 2.2 實作 embedding 產生函數 (`generateEmbedding`)
- [ ] 2.3 實作批次 embedding 處理 (`batchGenerateEmbeddings`)
- [ ] 2.4 建立單元測試 (mock OpenAI API)

## 3. 非同步處理 (Cloudflare Queues)

- [ ] 3.1 建立 embedding queue producer (`server/utils/embedding-queue.ts`)
- [ ] 3.2 建立 queue consumer worker (`workers/embedding-consumer.ts`)
- [ ] 3.3 整合至留言投稿流程 (投稿成功後發送 queue 訊息)
- [ ] 3.4 處理失敗重試邏輯 (max 3 retries)

## 4. 搜尋 API 實作

- [ ] 4.1 建立 `GET /api/search` endpoint
- [ ] 4.2 實作 query embedding 產生
- [ ] 4.3 實作向量相似度搜尋邏輯
- [ ] 4.4 實作分頁 (cursor-based)
- [ ] 4.5 實作 Premium Tier 權限檢查
- [ ] 4.6 建立 API 單元測試

## 5. 歷史資料 Migration

- [ ] 5.1 建立批次 embedding 產生 script (`scripts/backfill-embeddings.ts`)
- [ ] 5.2 實作進度追蹤與斷點續傳
- [ ] 5.3 實作 API 配額監控與限速
- [ ] 5.4 執行歷史資料處理 (可與功能上線並行)

## 6. 前端搜尋介面

- [ ] 6.1 建立 `components/search/SearchBar.vue` 組件
- [ ] 6.2 實作 debounce 搜尋 (300ms)
- [ ] 6.3 建立搜尋結果列表 `components/search/SearchResults.vue`
- [ ] 6.4 實作相似度分數顯示
- [ ] 6.5 實作搜尋關鍵字高亮
- [ ] 6.6 建立 Premium 功能鎖定 UI

## 7. 測試與驗收

- [ ] 7.1 單元測試: embedding 服務
- [ ] 7.2 單元測試: 搜尋 API
- [ ] 7.3 組件測試: SearchBar, SearchResults
- [ ] 7.4 E2E 測試: 完整搜尋流程
- [ ] 7.5 效能測試: 搜尋延遲 < 500ms (1000 筆資料)
- [ ] 7.6 TypeScript 型別檢查通過
- [ ] 7.7 ESLint 檢查通過

## 依賴關係

- Task 2 依賴 Task 1 (需要 schema 定義)
- Task 3 依賴 Task 2 (需要 embedding 服務)
- Task 4 依賴 Task 1, 2 (需要 schema 與 embedding 服務)
- Task 5 可與 Task 4-6 並行執行
- Task 6 依賴 Task 4 (需要搜尋 API)
- Task 7 依賴 Task 1-6 完成

## 可並行工作

- Task 5 (歷史資料) 與 Task 6 (前端) 可並行
- Task 2.4, 4.6, 6.6 (測試) 可在功能開發後並行處理
