# Design: AI 分析功能技術設計

## Context

Mallow Flow 需要 AI 功能來協助直播主管理大量留言。由於使用 Cloudflare Workers Serverless 環境，需要特別處理 AI API 的執行時間與成本控制問題。

### 限制條件

- Cloudflare Workers CPU 限制：50-100ms
- AI API 回應時間：1-5 秒
- 每月 AI 預算：3 USD/Premium 直播主
- 需支援降級策略確保服務穩定性

## Goals / Non-Goals

### Goals

- 提供即時內容審核，阻擋惡意內容
- 為 Premium 用戶提供情緒分析、自動標籤、自動摘要功能
- 精確追蹤 AI 使用成本
- 實作完善的降級策略

### Non-Goals

- 客製化標籤（未來功能）
- 多語言 AI 分析（初期僅支援繁體中文）
- 即時串流 AI 回應

## Decisions

### 決策 1: AI Provider 選擇

**選擇**: Google Gemini API

**理由**:
- 符合 project.md 技術規範
- 提供多種模型滿足不同場景
- 價格相對合理
- SDK 支援良好

**模型分配**:
| 功能 | 模型 | 理由 |
|------|------|------|
| 內容審核 | gemini-3-flash-lite | 低成本、快速回應 |
| 情緒分析 | gemini-3-flash | 較高準確度 |
| 自動標籤 | gemini-3-flash | 需要理解語意 |
| 自動摘要 | gemini-3-flash | 需要生成能力 |

### 決策 2: 執行架構

**選擇**: 同步呼叫 + 快取機制

**理由**:
- 內容審核必須同步（阻擋付款）
- Premium 功能在付款成功後觸發
- 使用 Cloudflare Cache API 減少重複呼叫

**替代方案**:
- Cloudflare Queues 非同步處理 - 增加複雜度，初期不採用
- Durable Objects - 成本較高，保留為未來擴展選項

### 決策 3: Prompt 安全策略

**選擇**: 結構化 System Prompt + 輸出驗證

**實作**:
```typescript
// 使用 JSON mode 確保輸出格式
const generationConfig = {
  responseMimeType: "application/json",
  responseSchema: moderationSchema // Zod schema
}
```

**防護措施**:
- 使用 System Prompt 明確定義任務邊界
- 對 AI 輸出進行 JSON Schema 驗證
- 記錄異常輸出供後續分析

### 決策 4: 配額追蹤機制

**選擇**: Database + Middleware 雙重追蹤

**資料流**:
1. AI 呼叫前：中介層檢查當月累計成本
2. AI 呼叫後：記錄至 `AiUsageLogs` 表
3. 超額時：記錄 warn log + 通知（不阻擋）

**成本計算**:
```typescript
// 基於 Gemini 3 定價
const COST_PER_1M_INPUT = 0.10  // USD
const COST_PER_1M_OUTPUT = 0.40 // USD

const calculateCost = (inputTokens: number, outputTokens: number) => {
  return (inputTokens * COST_PER_1M_INPUT + outputTokens * COST_PER_1M_OUTPUT) / 1_000_000
}
```

## Risks / Trade-offs

### Risk 1: AI API 延遲

**風險**: Gemini API 回應時間可能達 1-5 秒，可能超過 Serverless timeout

**緩解**:
- 內容審核使用 Flash Lite（較快）
- 設定 API timeout 為 10 秒
- 超時視為通過（fail-open for moderation）

### Risk 2: Prompt Injection

**風險**: 使用者可能在留言中注入惡意 prompt

**緩解**:
- 使用 JSON mode 限制輸出格式
- System Prompt 明確界定任務
- 輸出必須通過 Zod Schema 驗證
- 記錄所有異常回應

### Risk 3: AI 輸出不一致

**風險**: AI 輸出可能不穩定或格式錯誤

**緩解**:
- 使用 JSON mode + Schema 驗證
- 實作重試機制（最多 2 次）
- 驗證失敗時記錄並降級處理

### Risk 4: 成本失控

**風險**: 某些直播主可能產生大量 AI 呼叫

**緩解**:
- 即時追蹤每個直播主的使用量
- 超額時發送 warn 日誌
- 未來可加入 Rate Limiting

## Migration Plan

### Phase 1: Schema 擴充
1. 新增 `Questions` 表 AI 相關欄位
2. 建立 `AiUsageLogs` 表
3. 執行 migration

### Phase 2: 核心服務
1. 實作 AI 服務層 (`server/services/ai/`)
2. 實作配額追蹤中介層
3. 單元測試（Mock AI 回應）

### Phase 3: API 端點
1. 實作 `/api/ai/moderate`
2. 實作 `/api/ai/analyze`
3. 實作 `/api/streamer/ai-usage`

### Phase 4: 整合測試
1. E2E 測試完整流程
2. 效能測試（回應時間）
3. 成本追蹤驗證

### Rollback Plan
- 內容審核失敗：改為人工審核佇列（設定 `ai_review_status = 'pending'`）
- Premium 功能失敗：欄位設為 null，不影響核心流程
- 可透過 Feature Flag 快速停用 AI 功能

## Open Questions

1. **人工審核佇列 UI**: 當 AI 審核失敗時，直播主如何手動處理？
   - 建議：Phase 4 完成後再設計人工審核介面

2. **多語言支援**: 是否需要支援非繁體中文留言？
   - 建議：初期僅優化繁體中文 Prompt，未來視需求擴展

3. **重試成本**: 重試機制是否計入配額？
   - 建議：是，重試呼叫也計入成本追蹤
