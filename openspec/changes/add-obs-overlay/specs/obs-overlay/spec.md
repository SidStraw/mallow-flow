## ADDED Requirements

### Requirement: Overlay Page

系統 SHALL 提供公開 Overlay 頁面供 OBS Browser Source 載入。

#### Scenario: OBS 載入 Overlay

- **GIVEN** 直播主已建立專案且擁有 slug
- **WHEN** OBS Browser Source 載入 `/overlay/:slug`
- **THEN** 頁面以透明背景載入，顯示已投放的留言

#### Scenario: URL 參數覆寫設定

- **GIVEN** Overlay 頁面已載入
- **WHEN** URL 包含參數 `?theme=dark&fontSize=24&animation=slide`
- **THEN** 頁面使用 URL 參數覆寫預設設定

#### Scenario: 無效 slug

- **GIVEN** 請求的 slug 不存在
- **WHEN** OBS Browser Source 載入 `/overlay/:invalid-slug`
- **THEN** 頁面顯示空白（透明背景），不顯示錯誤訊息

---

### Requirement: Real-time Update via SWR Polling

系統 SHALL 使用 SWR Polling 策略實現近即時更新。

#### Scenario: 定期輪詢

- **GIVEN** Overlay 頁面已載入
- **WHEN** 經過 3-5 秒間隔
- **THEN** 系統自動向 API 請求最新顯示狀態

#### Scenario: Stale-While-Revalidate

- **GIVEN** Overlay 有快取資料
- **WHEN** 快取資料已過期 (staleTime 超過)
- **THEN** 系統先顯示快取資料，背景重新取得最新資料

#### Scenario: 斷線容錯

- **GIVEN** Overlay 頁面已載入且有顯示中的留言
- **WHEN** 網路暫時斷線
- **THEN** 系統保留最後有效狀態，不清空畫面
- **AND** 網路恢復後自動重新連線

#### Scenario: 重試機制

- **GIVEN** API 請求失敗
- **WHEN** 嘗試重新連線
- **THEN** 系統以指數退避策略重試 (1s, 2s, 4s...)，最多 3 次

---

### Requirement: Display Control

直播主 SHALL 能控制哪些留言顯示於 OBS Overlay。

#### Scenario: 投放留言至 OBS

- **GIVEN** 直播主在收件匣查看留言
- **WHEN** 點擊「投放至 OBS」按鈕
- **THEN** 留言的 `display_status` 設為 `queued` 或 `displayed`
- **AND** 留言在下次 Polling 時出現於 Overlay

#### Scenario: 從 OBS 移除留言

- **GIVEN** 留言正在 OBS 上顯示
- **WHEN** 直播主點擊「從 OBS 移除」
- **THEN** 留言的 `display_status` 設為 `hidden`
- **AND** 留言在下次 Polling 時從 Overlay 消失

#### Scenario: 緊急清空所有顯示

- **GIVEN** 有多則留言正在 OBS 上顯示
- **WHEN** 直播主點擊「清空所有顯示」
- **THEN** 所有留言的 `display_status` 設為 `hidden`
- **AND** Overlay 在下次 Polling 時變為空白

---

### Requirement: Theme System

系統 SHALL 提供多種視覺主題供選擇。

#### Scenario: Light Theme

- **GIVEN** 設定 `theme=light`
- **WHEN** Overlay 載入
- **THEN** 使用白色背景（OBS 中設為透明）、深色文字、淺色邊框

#### Scenario: Dark Theme

- **GIVEN** 設定 `theme=dark`
- **WHEN** Overlay 載入
- **THEN** 使用深色半透明背景、白色文字、發光效果

#### Scenario: Minimal Theme

- **GIVEN** 設定 `theme=minimal`
- **WHEN** Overlay 載入
- **THEN** 僅顯示文字，無背景與邊框

---

### Requirement: Animation System

系統 SHALL 提供進場/退場動畫效果。

#### Scenario: Fade 動畫

- **GIVEN** 設定 `animation=fade`
- **WHEN** 新留言加入或移除
- **THEN** 留言以漸入/漸出效果顯示

#### Scenario: Slide 動畫

- **GIVEN** 設定 `animation=slide`
- **WHEN** 新留言加入或移除
- **THEN** 留言以滑入/滑出效果顯示

#### Scenario: Bounce 動畫

- **GIVEN** 設定 `animation=bounce`
- **WHEN** 新留言加入
- **THEN** 留言以彈跳效果進入

#### Scenario: 無動畫

- **GIVEN** 設定 `animation=none`
- **WHEN** 新留言加入或移除
- **THEN** 留言立即出現/消失，無過渡效果

---

### Requirement: Display Mode

系統 SHALL 支援不同的顯示模式。

#### Scenario: 單則留言模式

- **GIVEN** 設定 `displayMode=single`
- **WHEN** Overlay 載入
- **THEN** 一次僅顯示一則留言

#### Scenario: 多則留言模式

- **GIVEN** 設定 `displayMode=multiple`
- **WHEN** Overlay 載入
- **THEN** 同時顯示多則留言（最多 `maxDisplayCount` 則）

#### Scenario: 自動輪播

- **GIVEN** 設定 `displayMode=single` 且有多則 `queued` 留言
- **WHEN** 經過 `autoRotateInterval` 秒
- **THEN** 自動切換至下一則留言

---

### Requirement: Overlay Settings Management

直播主 SHALL 能管理 Overlay 設定。

#### Scenario: 讀取設定

- **GIVEN** 直播主已登入
- **WHEN** 請求 `GET /api/streamer/overlay-settings`
- **THEN** 返回當前 overlay 設定 (theme, fontSize, animation 等)

#### Scenario: 更新設定

- **GIVEN** 直播主已登入
- **WHEN** 請求 `PUT /api/streamer/overlay-settings` 帶有新設定
- **THEN** 設定更新成功，返回更新後的設定

#### Scenario: 設定驗證

- **GIVEN** 直播主嘗試更新設定
- **WHEN** `fontSize` 超出範圍 (12-48)
- **THEN** 返回 400 錯誤，拒絕更新

---

### Requirement: Member Badge Display

系統 SHALL 支援會員徽章顯示控制。

#### Scenario: 顯示會員徽章

- **GIVEN** 設定 `showBadge=true` 且留言來自會員
- **WHEN** Overlay 顯示該留言
- **THEN** 顯示對應的會員等級徽章

#### Scenario: 隱藏會員徽章

- **GIVEN** 設定 `showBadge=false`
- **WHEN** Overlay 顯示留言
- **THEN** 不顯示任何會員徽章

---

### Requirement: Overlay API Endpoints

系統 SHALL 提供 Overlay 相關 API。

#### Scenario: 取得顯示中的留言

- **GIVEN** slug 對應的專案存在
- **WHEN** 請求 `GET /api/overlay/:slug`
- **THEN** 返回 `display_status` 為 `queued` 或 `displayed` 的留言清單

#### Scenario: 投放留言 API

- **GIVEN** 直播主已登入且留言屬於其專案
- **WHEN** 請求 `POST /api/questions/:id/display`
- **THEN** 留言 `display_status` 更新為 `displayed`，返回 200

#### Scenario: 移除留言 API

- **GIVEN** 直播主已登入且留言屬於其專案
- **WHEN** 請求 `DELETE /api/questions/:id/display`
- **THEN** 留言 `display_status` 更新為 `hidden`，返回 200

#### Scenario: 清空顯示 API

- **GIVEN** 直播主已登入
- **WHEN** 請求 `POST /api/overlay/:slug/clear`
- **THEN** 該專案所有留言的 `display_status` 設為 `hidden`，返回 200

#### Scenario: 未授權存取

- **GIVEN** 使用者未登入或無權限
- **WHEN** 請求修改類 API (POST/PUT/DELETE)
- **THEN** 返回 401 或 403 錯誤
