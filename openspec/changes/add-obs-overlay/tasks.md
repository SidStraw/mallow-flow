# Tasks: add-obs-overlay

## 依賴

- `add-core-messaging-flow`: 需要 Questions 資料模型與收件匣基礎功能

## 1. Database Schema 擴展

- [ ] 1.1 新增 `Questions.display_status` 欄位 (`hidden` | `queued` | `displayed`)
- [ ] 1.2 新增 `Streamers.overlay_settings` JSONB 欄位
- [ ] 1.3 建立 migration 檔案
- [ ] 1.4 更新 Drizzle schema 與型別

## 2. Overlay API 實作

- [ ] 2.1 實作 `GET /api/overlay/:slug` - 取得當前顯示的留言
- [ ] 2.2 實作 `POST /api/questions/:id/display` - 投放留言至 OBS
- [ ] 2.3 實作 `DELETE /api/questions/:id/display` - 從 OBS 移除留言
- [ ] 2.4 實作 `POST /api/overlay/:slug/clear` - 清空所有顯示
- [ ] 2.5 實作 `GET /api/streamer/overlay-settings` - 取得 overlay 設定
- [ ] 2.6 實作 `PUT /api/streamer/overlay-settings` - 更新 overlay 設定
- [ ] 2.7 新增 API 輸入驗證 (zod schema)

## 3. Overlay 頁面實作

- [ ] 3.1 建立 `pages/overlay/[slug].vue` 頁面
- [ ] 3.2 實作透明背景與 OBS 相容樣式
- [ ] 3.3 實作 URL 參數解析 (theme, fontSize, animation, showBadge)
- [ ] 3.4 建立 `composables/useOverlay.ts` (SWR Polling 邏輯)
- [ ] 3.5 實作斷線容錯與自動重連
- [ ] 3.6 實作 `lastValidData` 快取機制

## 4. Overlay UI 元件

- [ ] 4.1 建立 `components/overlay/OverlayQuestionCard.vue`
- [ ] 4.2 實作 Light/Dark/Minimal 三種主題樣式
- [ ] 4.3 實作進場/退場動畫 (fade, slide, bounce, pop, none)
- [ ] 4.4 實作會員徽章顯示/隱藏
- [ ] 4.5 實作單則/多則留言模式
- [ ] 4.6 實作自動輪播功能

## 5. 直播主後台控制

- [ ] 5.1 在收件匣留言卡片新增「投放至 OBS」按鈕
- [ ] 5.2 新增「從 OBS 移除」按鈕
- [ ] 5.3 新增「緊急清空所有顯示」功能
- [ ] 5.4 建立 Overlay 設定頁面 (`pages/streamer/settings/overlay.vue`)
- [ ] 5.5 實作即時預覽元件 (預覽 overlay 效果)

## 6. 測試

- [ ] 6.1 單元測試: Overlay API endpoints
- [ ] 6.2 單元測試: useOverlay composable (polling, 斷線處理)
- [ ] 6.3 組件測試: OverlayQuestionCard 各主題渲染
- [ ] 6.4 組件測試: 動畫效果正確觸發
- [ ] 6.5 E2E 測試: 投放留言 → Overlay 顯示 → 移除留言流程

## 7. 文件與驗收

- [ ] 7.1 更新 README 說明 OBS 整合使用方式
- [ ] 7.2 TypeScript 型別檢查通過
- [ ] 7.3 ESLint 檢查通過
- [ ] 7.4 驗收: OBS 可正常載入 overlay
- [ ] 7.5 驗收: 透明背景正確顯示
- [ ] 7.6 驗收: 新留言在 5 秒內顯示
- [ ] 7.7 驗收: 斷線重連測試通過
