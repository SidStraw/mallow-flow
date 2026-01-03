# Phase 5: 語意搜尋提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`add-semantic-search`

## 目標

使用 pgvector 與 Embedding 模型實作留言語意搜尋功能。

### 具體交付項目

1. **資料庫 Schema 擴充**
   - `Questions` 表新增欄位：
     - `embedding` (Vector(1536)) - 語意搜尋向量資料
   - 建立 pgvector 索引優化查詢效能
   - 建立向量相似度搜尋函數

2. **向量化處理**
   - 留言建立時自動產生 embedding
   - 使用 `text-embedding-3-small` 模型
   - 非同步處理（不阻擋投稿流程）
   - 批次處理歷史留言

3. **語意搜尋 API**
   - `GET /api/search?q=...` - 語意搜尋
   - 搜尋範圍：單一直播主的所有留言
   - 回傳相似度分數與排序
   - 支援分頁

4. **搜尋介面**
   - 直播主後台搜尋功能
   - 即時搜尋建議（debounce）
   - 搜尋結果高亮顯示
   - 結果顯示相似度指標

## 技術規範

### Embedding 模型

- **Provider**: OpenAI
- **Model**: `text-embedding-3-small`
- **Dimension**: 1536
- **成本**: ~$0.02 / 1M tokens

### pgvector 設定

```sql
-- 啟用 extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 建立索引（IVFFlat 或 HNSW）
CREATE INDEX ON questions 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 查詢範例

```typescript
// 語意搜尋查詢
const results = await db.execute(sql`
  SELECT 
    id, content, ai_summary,
    1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM questions
  WHERE project_id = ${projectId}
    AND embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 20
`);
```

### 效能目標

- 搜尋延遲 < 500ms（1000 筆資料內）
- 索引建立後延遲 < 100ms

## 依賴

- `setup-database-and-auth`（需要 pgvector extension）
- `add-ai-analysis-features`（需要 AI 基礎設施）

## 驗收標準

### 功能驗收

- [ ] 可以用自然語言搜尋留言
- [ ] 「遊戲推薦」可以找到相關遊戲討論
- [ ] 搜尋結果按相似度排序
- [ ] Premium 功能正確鎖定
- [ ] 搜尋介面即時回應

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] 向量維度正確（1536）
- [ ] 索引正確建立
- [ ] 搜尋延遲 < 500ms
- [ ] 單元測試覆蓋搜尋邏輯

## 風險與注意事項

1. **成本考量**
   - 每則留言產生 embedding 約 100-500 tokens
   - 大量留言可能產生成本
   - 考慮設定每日產生上限

2. **非同步處理**
   - embedding 產生可能需要 1-2 秒
   - 使用 Cloudflare Queues 或 Durable Objects
   - 留言在 embedding 完成前無法被搜尋

3. **冷啟動**
   - 歷史留言需要批次處理
   - 建立 migration script 處理現有資料

4. **索引選擇**
   - IVFFlat：建立快、查詢略慢
   - HNSW：建立慢、查詢快
   - 根據資料量選擇適當索引

## 研究項目

1. **本地 Embedding 模型評估**
   - 評估是否使用本地模型降低成本
   - 候選：`all-MiniLM-L6-v2`、`multilingual-e5-small`
   - 需評估中文支援度與效能

2. **Hybrid Search**
   - 結合關鍵字搜尋與語意搜尋
   - 提高搜尋準確度

## 上下文參考

### AI 功能層級（來自 project.md）

| 功能 | Free Tier | Premium Tier |
| --- | --------- | ------------ |
| 語意搜尋 | ❌ | ✅ |

### 技術堆疊（來自 project.md）

- **本地模型**: text-embedding-3-small，不做絕對限制、開發過程中研究並確認具體方案
- **Database**: PostgreSQL + pgvector extension

---

請產生 `proposal.md`、`tasks.md`、`design.md`（因為有 Embedding 方案的技術決策）和 `spec.deltas.md`，建立 `semantic-search` capability 的 specs。
