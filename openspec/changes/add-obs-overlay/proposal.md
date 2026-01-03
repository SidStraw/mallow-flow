# Change: OBS Overlay 即時留言展示整合

## Why

直播主需要在 OBS 中即時展示觀眾留言，但 Serverless 架構無法使用 WebSocket。
此變更建立基於 SWR Polling 的 OBS Browser Source 整合方案，讓直播主能選擇性投放留言至畫面。

## What Changes

- **ADDED**: 公開 Overlay 頁面 `/overlay/:slug`（透明背景供 OBS 疊加）
- **ADDED**: Overlay 設定管理（主題、字體、動畫、顯示模式）
- **ADDED**: 留言投放控制（投放/移除/清空）
- **ADDED**: SWR Polling 即時更新機制（3-5 秒間隔）
- **ADDED**: 斷線容錯與自動重連
- **ADDED**: API Endpoints（overlay 資料、設定、投放控制）

## Impact

- Affected specs: `obs-overlay` (新建)
- Affected code:
  - `pages/overlay/[slug].vue` - Overlay 頁面
  - `server/api/overlay/` - Overlay API
  - `server/api/streamer/overlay-settings.ts` - 設定 API
  - `composables/useOverlay.ts` - SWR Polling 邏輯
  - `components/overlay/` - Overlay UI 元件
- Dependencies: `add-core-messaging-flow`（需要 Questions 資料模型與收件匣功能）

## Risks

1. **OBS 相容性**: CEF 基於 Chromium，需避免過新的 Web API
2. **效能**: 長時間運行可能產生記憶體洩漏，需實作效能監控
3. **即時性限制**: Polling 有 3-5 秒延遲，無法即時同步（接受此限制）
4. **網路不穩定**: 直播環境網路可能不穩，需優雅降級

## Open Questions

無（技術方案已明確，使用 SWR Polling 符合專案 Serverless-First 架構）
