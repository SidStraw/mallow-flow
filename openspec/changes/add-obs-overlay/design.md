# Design: OBS Overlay 整合

## Context

Mallow Flow 需要 OBS 整合功能，讓直播主能在直播畫面中展示觀眾留言。
由於專案採用 Cloudflare Workers (Serverless)，無法使用 WebSocket 長連線。
根據 `project.md` 的 Architecture Patterns，OBS Overlay 使用 SWR Polling 策略。

### 利害關係人

- **直播主**: 需要控制哪些留言顯示在畫面上
- **觀眾**: 期望自己的留言被選中展示
- **技術團隊**: 需確保 Serverless 相容性與效能

## Goals / Non-Goals

### Goals

- 提供穩定的 OBS Browser Source 整合
- 支援多種視覺主題與動畫效果
- 實作斷線容錯機制
- 提供直播主完整的投放控制

### Non-Goals

- 不實作 WebSocket（違反 Serverless-First 原則）
- 不追求 <1 秒的即時同步（接受 3-5 秒延遲）
- 不實作複雜的排版編輯器（Phase 1 使用預設主題）

## Decisions

### 1. 即時更新策略: SWR Polling

**決策**: 使用 TanStack Query 實作 Stale-While-Revalidate 策略

**理由**:
- 符合專案 Serverless-First 架構
- TanStack Query 已在技術棧中（@tanstack/vue-query）
- SWR 確保畫面流暢（舊資料先顯示，背景更新）

**替代方案**:
- Server-Sent Events (SSE): Cloudflare Workers 支援有限，放棄
- WebSocket + Durable Objects: 增加複雜度與成本，Phase 1 不採用

### 2. 狀態管理: 新增 `display_status` 欄位

**決策**: 在 Questions 資料表新增 `display_status` 欄位

```typescript
display_status: 'hidden' | 'queued' | 'displayed'
```

**理由**:
- 簡單明確的三態設計
- `hidden`: 預設狀態，不顯示於 OBS
- `queued`: 已投放，等待顯示（支援佇列管理）
- `displayed`: 正在 OBS 上顯示

### 3. URL 路由設計

**決策**: 使用 `/overlay/:slug` 路由

**理由**:
- `slug` 對應直播主的唯一識別碼
- 公開頁面，無需驗證（OBS Browser Source 無法處理 OAuth）
- 透過 URL 參數傳遞樣式設定，避免需要 cookie

### 4. 設定儲存策略

**決策**: Overlay 設定儲存於 `Streamers` 資料表的 JSONB 欄位

```typescript
overlay_settings: {
  theme: 'light' | 'dark' | 'minimal',
  fontSize: 12-48,
  animation: 'fade' | 'slide' | 'bounce' | 'pop' | 'none',
  showBadge: boolean,
  displayMode: 'single' | 'multiple',
  autoRotateInterval: number, // 秒
  maxDisplayCount: number
}
```

**理由**:
- 減少 join 查詢，設定不頻繁變動
- JSONB 提供彈性擴展

## Risks / Trade-offs

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| Polling 延遲 | 使用者體驗 | UI 說明 3-5 秒同步間隔 |
| 記憶體洩漏 | 長時間運行崩潰 | 實作 cleanup 與監控 |
| OBS CEF 相容性 | 動畫不正常 | 使用標準 CSS Transitions |
| 網路不穩定 | Overlay 空白 | 保留最後有效狀態 |

## Migration Plan

1. **Phase 1**: 基礎 Overlay 功能（本次變更）
2. **Phase 2**: 進階自訂（CSS 編輯器、自訂字體）
3. **Phase 3**: 考慮 Durable Objects WebSocket 升級

### Rollback

- Overlay 為獨立功能，移除不影響核心留言流程
- Database migration 可反向執行

## Technical Details

### API 設計

```
GET  /api/overlay/:slug           # 取得顯示中的留言
POST /api/questions/:id/display   # 投放留言
DELETE /api/questions/:id/display # 移除留言
POST /api/overlay/:slug/clear     # 清空所有顯示
GET  /api/streamer/overlay-settings   # 取得設定
PUT  /api/streamer/overlay-settings   # 更新設定
```

### 斷線處理策略

```typescript
// 保留最後有效狀態
const lastValidData = ref<Question[]>([]);

const { data, error, isError } = useQuery({
  queryKey: ['overlay', slug],
  queryFn: () => fetchOverlayQuestions(slug),
  staleTime: 3000,
  refetchInterval: 5000,
  refetchOnWindowFocus: false,
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});

// 成功時更新快取
watch(data, (newData) => {
  if (newData) lastValidData.value = newData;
});

// 顯示時使用快取
const displayData = computed(() => data.value ?? lastValidData.value);
```

### 動畫系統

使用 Vue Transition 搭配 CSS animation，確保 OBS CEF 相容：

```vue
<TransitionGroup 
  name="question" 
  :css="true"
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @leave="onLeave"
>
  <OverlayQuestionCard 
    v-for="question in displayedQuestions"
    :key="question.id"
  />
</TransitionGroup>
```

## Open Questions

（無未解決問題）
