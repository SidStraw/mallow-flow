# Design: 語意搜尋技術決策

## Context

語意搜尋功能需要將留言文字轉換為向量表示，並在資料庫中進行相似度搜尋。主要技術決策包括 Embedding 模型選擇、向量儲存與索引策略。

### 利害關係人

- **直播主**：使用語意搜尋找尋歷史留言
- **開發團隊**：維護 embedding 處理與搜尋 API
- **系統**：承擔 API 呼叫成本與儲存空間

### 約束條件

- PostgreSQL + pgvector 已規劃於 project.md
- Premium Tier 專屬功能
- Cloudflare Workers 執行環境 (CPU 時間限制)

## Goals / Non-Goals

### Goals

- 提供自然語言搜尋能力，支援語意相似性匹配
- 搜尋延遲 < 500ms（1000 筆資料內）
- 不阻擋留言投稿流程

### Non-Goals

- 本階段不實作 Hybrid Search（語意 + 關鍵字混合搜尋）
- 不支援跨直播主搜尋（僅搜尋單一直播主的留言）
- 不實作即時 embedding 更新（留言編輯時不重新產生）

## Decisions

### Decision 1: Embedding 模型選擇

**選擇**: `text-embedding-3-small` (OpenAI)

**理由**:
- 維度 1536，平衡效能與精度
- 成本低 (~$0.02/1M tokens)
- 多語言支援良好（含中文）
- 已在 project.md 中指定

**備選評估**:

| 模型 | 維度 | 成本 | 中文支援 | 備註 |
|------|------|------|----------|------|
| text-embedding-3-small | 1536 | $0.02/1M | ✅ 良好 | **選定** |
| text-embedding-3-large | 3072 | $0.13/1M | ✅ 良好 | 維度過大 |
| all-MiniLM-L6-v2 | 384 | 免費 (本地) | ⚠️ 弱 | 中文支援不足 |
| multilingual-e5-small | 384 | 免費 (本地) | ✅ 良好 | Cloudflare Workers 無法執行 |

**後續評估項目**:
- 若成本超出預期，評估 `multilingual-e5-small` 搭配外部推論服務
- 監控實際 token 使用量與成本

### Decision 2: 向量索引策略

**選擇**: IVFFlat (初期) → HNSW (資料量增長後)

**理由**:
- IVFFlat 建立快、適合初期開發與測試
- 當單一直播主留言超過 10,000 筆時評估轉換至 HNSW
- pgvector 同時支援兩種索引，可線上切換

**參數設定**:
```sql
-- IVFFlat 索引 (初期)
CREATE INDEX ON questions 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- HNSW 索引 (後期，資料量 > 10k)
CREATE INDEX ON questions 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Decision 3: 非同步 Embedding 處理

**選擇**: Cloudflare Queues + 輪詢狀態

**理由**:
- 留言投稿不應被 embedding 生成阻擋
- Cloudflare Queues 提供可靠的非同步任務處理
- 與現有 Cloudflare 架構一致

**流程**:
```
1. 留言投稿 → 儲存至 DB (embedding = null)
2. 發送訊息至 Cloudflare Queue
3. Queue Consumer 呼叫 OpenAI API 產生 embedding
4. 更新 DB embedding 欄位
5. 留言可被語意搜尋
```

**備選方案**:
- Durable Objects：較複雜，適合需要狀態管理的場景
- 同步處理：會增加投稿延遲，不採用

### Decision 4: 搜尋範圍與權限

**選擇**: 單一直播主範圍 + Premium Tier 限定

**理由**:
- 符合 project.md AI 功能層級定義
- 避免跨直播主資料洩漏
- 簡化權限檢查邏輯

**查詢結構**:
```sql
SELECT id, content, ai_summary,
       1 - (embedding <=> $queryEmbedding::vector) as similarity
FROM questions
WHERE project_id = $projectId
  AND embedding IS NOT NULL
ORDER BY embedding <=> $queryEmbedding::vector
LIMIT 20;
```

## Risks / Trade-offs

### Risk 1: API 成本超出預期

**風險**: 大量留言導致 embedding 成本超出預算

**緩解措施**:
- 監控每直播主 embedding API 使用量
- 設定每日產生上限 (建議: 500 筆/日)
- 超額時發送告警，不停用服務

### Risk 2: Embedding 延遲影響使用體驗

**風險**: 新留言 1-2 秒內無法被搜尋

**緩解措施**:
- UI 顯示「正在處理中」狀態
- 搜尋結果優先顯示已有 embedding 的留言
- 接受此為技術限制，不影響核心功能

### Risk 3: 索引效能隨資料量下降

**風險**: 單一直播主留言超過 10,000 筆時搜尋變慢

**緩解措施**:
- 監控搜尋延遲指標
- 預設 HNSW 索引切換閾值
- 必要時增加 `probes` (IVFFlat) 或 `ef_search` (HNSW) 參數

## Migration Plan

### Phase 1: Schema Migration

1. 啟用 pgvector extension
2. 新增 `Questions.embedding` 欄位 (nullable)
3. 建立 IVFFlat 索引

### Phase 2: 歷史資料處理

1. 建立 migration script 處理現有留言
2. 批次處理 (建議 100 筆/批)
3. 監控 API 配額消耗

### Phase 3: 功能上線

1. 部署 embedding 處理 worker
2. 部署搜尋 API
3. 啟用前端搜尋介面

### Rollback Plan

1. 停用搜尋介面 (feature flag)
2. 停止 embedding worker
3. 保留 embedding 資料（不刪除）
4. 搜尋 API 回傳空結果

## Open Questions

1. **批次處理優先順序**: 歷史留言 embedding 是否按時間倒序處理？
2. **成本監控粒度**: 是否需要區分「歷史補建」與「即時產生」的成本統計？
3. **搜尋結果快取**: 是否對熱門查詢實作結果快取？
