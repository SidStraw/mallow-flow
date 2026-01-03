# Phase 7: OBS Overlay 整合提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`add-obs-overlay`

## 目標

建立 OBS Browser Source 即時留言展示頁面。

### 具體交付項目

1. **Overlay 頁面**
   - 公開頁面 `/overlay/:slug`
   - 透明背景（供 OBS 疊加使用）
   - 顯示已標記為 `visible` 的留言
   - 支援多種佈局模式

2. **即時更新機制**
   - SWR Polling 策略（3-5 秒間隔）
   - Stale-While-Revalidate 確保畫面流暢
   - 斷線容錯（短暫斷線不崩潰）
   - 自動重連機制

3. **樣式自訂**
   - 預設主題選擇
   - 自訂顏色配置
   - 自訂字體大小
   - 進場/退場動畫設定
   - 顯示/隱藏會員徽章

4. **顯示設定**
   - 單則/多則留言模式
   - 自動輪播間隔設定
   - 顯示時長設定
   - 佇列管理（先進先出）

5. **直播主控制**
   - 從收件匣「投放至 OBS」
   - 從 OBS 移除留言
   - 緊急清空所有顯示
   - 即時預覽（在後台查看 overlay 效果）

6. **API Endpoints**
   - `GET /api/overlay/:slug` - 取得當前顯示的留言
   - `POST /api/questions/:id/display` - 投放留言至 OBS
   - `DELETE /api/questions/:id/display` - 從 OBS 移除留言
   - `POST /api/overlay/:slug/clear` - 清空所有顯示
   - `GET /api/streamer/overlay-settings` - 取得 overlay 設定
   - `PUT /api/streamer/overlay-settings` - 更新 overlay 設定

## 技術規範

### SWR Polling 實作

```typescript
// 使用 TanStack Query 實作 SWR
const { data, isStale } = useQuery({
  queryKey: ['overlay', slug],
  queryFn: () => fetchOverlayQuestions(slug),
  staleTime: 3000, // 3 秒後標記為 stale
  refetchInterval: 5000, // 5 秒重新取得
  refetchOnWindowFocus: false,
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});
```

### 動畫系統

```typescript
// 使用 Vue Transition
<TransitionGroup name="question-fade">
  <QuestionCard 
    v-for="question in displayedQuestions"
    :key="question.id"
  />
</TransitionGroup>

// CSS 動畫
.question-fade-enter-active,
.question-fade-leave-active {
  transition: all 0.5s ease;
}
```

### 斷線處理

```typescript
// 斷線時保持最後狀態
const lastValidData = ref(null);

watch(data, (newData) => {
  if (newData) {
    lastValidData.value = newData;
  }
});

// 顯示時使用 lastValidData
const displayData = computed(() => 
  data.value ?? lastValidData.value
);
```

### URL 參數支援

```
/overlay/peko?theme=dark&fontSize=24&animation=slide
```

- `theme`: light, dark, custom
- `fontSize`: 12-48
- `animation`: fade, slide, bounce, none
- `showBadge`: true, false

## 依賴

- `add-core-messaging-flow`（需要留言資料）

## 驗收標準

### 功能驗收

- [ ] OBS 可以正常載入 overlay
- [ ] 透明背景正確顯示
- [ ] 新留言在 5 秒內顯示
- [ ] 動畫效果流暢
- [ ] 短暫斷線不會導致頁面崩潰
- [ ] 樣式自訂正常運作
- [ ] 直播主可投放/移除留言

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] SWR Polling 正確實作
- [ ] 斷線重連測試通過
- [ ] 動畫效能測試（60fps）
- [ ] 組件測試覆蓋主要元件

## 風險與注意事項

1. **OBS 相容性**
   - OBS Browser Source 使用 CEF (Chromium Embedded Framework)
   - 需測試 CSS 動畫相容性
   - 避免使用過新的 Web API

2. **效能考量**
   - 長時間運行的記憶體洩漏
   - 大量動畫可能造成 CPU 負擔
   - 需實作效能監控

3. **網路不穩定**
   - 直播環境網路可能不穩定
   - 需要優雅的降級顯示
   - 考慮離線快取策略

4. **即時性限制**
   - 無 WebSocket，Polling 有 3-5 秒延遲
   - 需在 UI 中說明此限制
   - 考慮未來升級至 Cloudflare Durable Objects WebSocket

## 設計需求

### 預設主題

1. **Light Theme**
   - 白色背景（實際使用時設為透明）
   - 深色文字
   - 淺色邊框

2. **Dark Theme**
   - 深色半透明背景
   - 白色文字
   - 發光效果

3. **Minimal Theme**
   - 僅顯示文字
   - 無背景/邊框
   - 適合疊加在複雜畫面

### 動畫效果

1. **Fade** - 漸入漸出
2. **Slide** - 滑入滑出
3. **Bounce** - 彈跳效果
4. **Pop** - 縮放彈出

## 上下文參考

### OBS 整合（來自 project.md）

- **與平台無關**: OBS overlay 獨立於直播平台
- **更新機制**: 使用 SWR Polling (3-5 秒間隔)
- **斷線處理**: 設計容錯機制，避免短暫斷線導致 overlay 崩潰

### 架構模式（來自 project.md）

- **無 WebSocket**: Serverless 環境不使用長連線，改用 Polling + Optimistic UI
- **SWR Strategy**: OBS Overlay 使用 Stale-While-Revalidate 策略

---

請產生 `proposal.md`、`tasks.md` 和 `spec.deltas.md`，建立 `obs-overlay` capability 的 specs。
