# Mallow Flow MVP 提案提示詞

本目錄包含 Mallow Flow MVP 各階段的提案提示詞，用於配合 `@.github/prompts/openspec-proposal.prompt.md` 建立 OpenSpec 變更提案。

## 使用方式

1. 開啟 GitHub Copilot Chat
2. 選擇對應階段的提示詞檔案
3. 配合 `@.github/prompts/openspec-proposal.prompt.md` 執行
4. 按照 OpenSpec 流程建立提案

## 階段概覽

| 階段 | 檔案 | Change ID | 依賴 |
|-----|------|-----------|------|
| Phase 1 | [phase-1-setup-database-and-auth.md](./phase-1-setup-database-and-auth.md) | `setup-database-and-auth` | 無 |
| Phase 2 | [phase-2-core-messaging-flow.md](./phase-2-core-messaging-flow.md) | `add-core-messaging-flow` | Phase 1 |
| Phase 3 | [phase-3-payment-and-points-system.md](./phase-3-payment-and-points-system.md) | `add-payment-and-points-system` | Phase 2 |
| Phase 4 | [phase-4-ai-analysis-features.md](./phase-4-ai-analysis-features.md) | `add-ai-analysis-features` | Phase 2, 3 |
| Phase 5 | [phase-5-semantic-search.md](./phase-5-semantic-search.md) | `add-semantic-search` | Phase 1, 4 |
| Phase 6 | [phase-6-platform-oauth-integration.md](./phase-6-platform-oauth-integration.md) | `add-platform-oauth-integration` | Phase 2 |
| Phase 7 | [phase-7-obs-overlay.md](./phase-7-obs-overlay.md) | `add-obs-overlay` | Phase 2 |

## 依賴關係圖

```
Phase 1: setup-database-and-auth
    │
    ├── Phase 2: add-core-messaging-flow
    │       │
    │       ├── Phase 3: add-payment-and-points-system
    │       │       │
    │       │       └── Phase 4: add-ai-analysis-features ─┐
    │       │                                              │
    │       ├── Phase 6: add-platform-oauth-integration    │
    │       │                                              │
    │       └── Phase 7: add-obs-overlay                   │
    │                                                      │
    └───────────────────────────────────────────────────────┘
                                                           │
                                              Phase 5: add-semantic-search
```

## 各階段簡介

### Phase 1: 基礎設施與資料層
- Nuxt 4 專案初始化
- Drizzle ORM Schema (Streamers, Projects)
- Email Magic Link 驗證
- 專案管理 CRUD

### Phase 2: 核心留言功能
- 觀眾匿名投稿
- 直播主收件匣
- 留言狀態管理
- Optimistic UI

### Phase 3: 金流與點數系統
- Recur 金流整合
- 點數經濟系統
- 自動退款機制
- Transaction 保護

### Phase 4: AI 分析功能
- Gemini API 整合
- 內容審核 (Moderation)
- 情緒分析、自動標籤、摘要
- AI 配額監控

### Phase 5: 語意搜尋
- pgvector 整合
- Embedding 向量化
- 語意搜尋 API
- 搜尋介面

### Phase 6: 直播平台整合
- YouTube/Twitch OAuth
- 會員等級驗證
- 會員限制投稿
- API 快取機制

### Phase 7: OBS Overlay
- Browser Source 頁面
- SWR Polling 即時更新
- 樣式自訂
- 斷線容錯

## 技術堆疊摘要

- **Frontend**: Nuxt 4 + Vue 3 + TailwindCSS + Nuxt UI
- **Backend**: Nuxt Server Routes (Nitro)
- **Database**: PostgreSQL + Drizzle ORM + pgvector
- **Auth**: Nuxt Auth Utils (Magic Link + OAuth)
- **AI**: Google Gemini API + OpenAI Embedding
- **Payment**: Recur (TapPay)
- **Deployment**: Cloudflare Pages + Workers
