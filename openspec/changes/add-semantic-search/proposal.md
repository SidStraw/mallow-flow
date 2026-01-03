# Change: 新增語意搜尋功能

## Why

直播主需要透過自然語言快速搜尋歷史留言，找出相關內容（如「遊戲推薦」可找到所有遊戲討論）。傳統關鍵字搜尋無法理解語意相似性，無法滿足此需求。

## What Changes

- **新增 `semantic-search` capability**：語意搜尋功能
- **Database Schema 擴充**：Questions 表新增 `embedding` 欄位 (Vector(1536))
- **新增向量化處理**：留言建立時非同步產生 embedding
- **新增搜尋 API**：`GET /api/search?q=...`
- **新增搜尋介面**：直播主後台搜尋功能

## Impact

- Affected specs: `semantic-search` (新增)
- Affected code:
  - `server/database/schema.ts` - 新增 embedding 欄位
  - `server/api/search/` - 搜尋 API
  - `server/services/embedding.ts` - Embedding 服務
  - `components/search/` - 搜尋介面
  - Database migration - pgvector extension 與索引

## Dependencies

- **setup-database-and-auth**: 需要 PostgreSQL + pgvector extension
- **add-ai-analysis-features**: 需要 AI 基礎設施（OpenAI API 連線）

## Risks

1. **成本控制**：每則留言 embedding 約 100-500 tokens，大量留言可能產生成本
2. **非同步延遲**：embedding 產生需 1-2 秒，新留言短暫無法被搜尋
3. **索引選擇**：IVFFlat vs HNSW 需根據資料量選擇
