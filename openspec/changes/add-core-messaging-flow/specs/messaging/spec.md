## ADDED Requirements

### Requirement: Questions Database Schema

系統 SHALL 提供 `Questions` 資料表儲存觀眾留言。

**欄位定義**:
- `id` (Serial, PK) - 主鍵
- `project_id` (UUID, FK → Projects) - 歸屬專案
- `viewer_id` (UUID, FK → Viewers, Nullable) - 關聯觀眾，可為空
- `display_name` (Text) - 顯示名稱
- `content` (Text) - 留言內容
- `status` (Text) - 狀態：'pending' | 'visible' | 'hidden'
- `is_hidden_by_streamer` (Boolean) - 是否被直播主移除
- `created_at` (Timestamp) - 建立時間
- `updated_at` (Timestamp) - 更新時間

**索引**:
- `idx_questions_project_status` (project_id, status)
- `idx_questions_created_at` (created_at DESC)

#### Scenario: 建立 Questions 表

- **WHEN** 執行 database migration
- **THEN** Questions 表存在且包含所有必要欄位
- **AND** 索引已建立

---

### Requirement: Viewers Database Schema

系統 SHALL 提供 `Viewers` 資料表預留觀眾資料結構。

**欄位定義**:
- `id` (UUID, PK) - 主鍵
- `created_at` (Timestamp) - 建立時間

#### Scenario: 建立 Viewers 表

- **WHEN** 執行 database migration
- **THEN** Viewers 表存在且包含基礎欄位

---

### Requirement: 觀眾投稿 API

系統 SHALL 提供 `POST /api/questions` endpoint 供觀眾投稿留言。

**請求參數**:
- `project_id` (UUID, 必填) - 目標專案
- `content` (Text, 必填) - 留言內容，10-500 字
- `display_name` (Text, 選填) - 顯示名稱，若未提供則自動產生匿名暱稱

**回應**:
- 成功：HTTP 201，回傳建立的 Question
- 失敗：HTTP 400/422，回傳錯誤訊息

#### Scenario: 成功投稿留言

- **WHEN** 觀眾送出有效投稿（content 長度 10-500 字）
- **THEN** 系統建立 Question 記錄，狀態為 'pending'
- **AND** 回傳 HTTP 201 與建立的 Question 資料

#### Scenario: 投稿內容過短

- **WHEN** 觀眾送出 content 少於 10 字的投稿
- **THEN** 系統回傳 HTTP 422
- **AND** 錯誤訊息說明字數不足

#### Scenario: 投稿內容過長

- **WHEN** 觀眾送出 content 超過 500 字的投稿
- **THEN** 系統回傳 HTTP 422
- **AND** 錯誤訊息說明字數超過限制

#### Scenario: 自動產生匿名暱稱

- **WHEN** 觀眾未提供 display_name
- **THEN** 系統自動產生友善的匿名暱稱（如「快樂的企鵝」）

---

### Requirement: 投稿 Rate Limiting

系統 SHALL 限制每 IP 每分鐘最多 5 次投稿。

#### Scenario: Rate Limit 未超過

- **WHEN** 同一 IP 在一分鐘內投稿次數少於 5 次
- **THEN** 允許投稿

#### Scenario: Rate Limit 超過

- **WHEN** 同一 IP 在一分鐘內投稿次數達到 5 次
- **AND** 該 IP 再次嘗試投稿
- **THEN** 系統回傳 HTTP 429 (Too Many Requests)
- **AND** 錯誤訊息說明需等待後再試

---

### Requirement: 收件匣留言列表 API

系統 SHALL 提供 `GET /api/inbox` endpoint 供直播主查詢留言。

**請求參數**:
- `status` (Text, 選填) - 篩選狀態：'all' | 'pending' | 'visible' | 'hidden'，預設 'all'
- `cursor` (Text, 選填) - 分頁游標
- `limit` (Number, 選填) - 每頁筆數，預設 20，最大 100

**回應**:
- 成功：HTTP 200，回傳留言列表與分頁資訊
- 未授權：HTTP 401

**權限**:
- 僅能查詢已登入直播主所屬專案的留言

#### Scenario: 查詢全部留言

- **WHEN** 已登入的直播主請求 `/api/inbox`
- **THEN** 系統回傳該直播主所有專案的留言列表
- **AND** 依建立時間降序排列

#### Scenario: 篩選待處理留言

- **WHEN** 已登入的直播主請求 `/api/inbox?status=pending`
- **THEN** 系統僅回傳狀態為 'pending' 的留言

#### Scenario: 分頁查詢

- **WHEN** 已登入的直播主請求 `/api/inbox?cursor=xxx&limit=20`
- **THEN** 系統回傳游標後的 20 筆留言
- **AND** 回傳下一頁游標（若有更多資料）

#### Scenario: 未授權存取

- **WHEN** 未登入使用者請求 `/api/inbox`
- **THEN** 系統回傳 HTTP 401

---

### Requirement: 更新留言狀態 API

系統 SHALL 提供 `PUT /api/questions/:id/status` endpoint 供直播主更新留言狀態。

**請求參數**:
- `status` (Text, 必填) - 目標狀態：'visible' | 'hidden'

**狀態轉換規則**:
- `pending` → `visible` ✓
- `pending` → `hidden` ✓
- `visible` → `hidden` ✓
- `hidden` → `visible` ✗（不允許）
- `visible` → `pending` ✗（不允許）

**權限**:
- 僅能操作已登入直播主所屬專案的留言

#### Scenario: 標記為已處理

- **WHEN** 直播主將 pending 狀態的留言更新為 visible
- **THEN** 系統更新留言狀態為 'visible'
- **AND** 回傳 HTTP 200

#### Scenario: 隱藏留言

- **WHEN** 直播主將任何非 hidden 狀態的留言更新為 hidden
- **THEN** 系統更新留言狀態為 'hidden'
- **AND** 回傳 HTTP 200

#### Scenario: 非法狀態轉換

- **WHEN** 直播主嘗試將 hidden 狀態的留言更新為 visible
- **THEN** 系統回傳 HTTP 422
- **AND** 錯誤訊息說明不允許此狀態轉換

#### Scenario: 無權限操作

- **WHEN** 直播主嘗試操作其他直播主專案的留言
- **THEN** 系統回傳 HTTP 403

---

### Requirement: 隱藏留言 API

系統 SHALL 提供 `DELETE /api/questions/:id` endpoint 供直播主隱藏留言（軟刪除）。

**行為**:
- 設定 `is_hidden_by_streamer = true`
- 設定 `status = 'hidden'`

**權限**:
- 僅能操作已登入直播主所屬專案的留言

#### Scenario: 成功隱藏留言

- **WHEN** 直播主刪除自己專案的留言
- **THEN** 系統設定 `is_hidden_by_streamer = true` 與 `status = 'hidden'`
- **AND** 回傳 HTTP 200

#### Scenario: 無權限刪除

- **WHEN** 直播主嘗試刪除其他直播主專案的留言
- **THEN** 系統回傳 HTTP 403

---

### Requirement: 觀眾投稿頁面

系統 SHALL 提供 `/u/:slug` 頁面供觀眾投稿留言。

**功能**:
- 顯示目標直播主/專案資訊
- 提供投稿表單（display_name 選填、content 必填）
- 即時顯示字數（10-500 字限制）
- 送出後顯示成功/失敗訊息

#### Scenario: 載入投稿頁面

- **WHEN** 觀眾訪問 `/u/:slug`
- **THEN** 系統顯示對應直播主的投稿頁面
- **AND** 顯示投稿表單

#### Scenario: 多專案選擇

- **WHEN** 直播主有多個啟用中的專案
- **THEN** 投稿頁面顯示專案選擇器
- **AND** 觀眾可選擇要投稿的專案

#### Scenario: 投稿成功

- **WHEN** 觀眾成功送出投稿
- **THEN** 頁面顯示感謝訊息
- **AND** 表單重置

#### Scenario: 投稿失敗

- **WHEN** 投稿失敗（驗證失敗、Rate Limit 等）
- **THEN** 頁面顯示對應的錯誤訊息
- **AND** 表單內容保留供使用者修改

---

### Requirement: 直播主收件匣頁面

系統 SHALL 提供 `/dashboard/inbox` 頁面供直播主管理留言。

**功能**:
- 顯示留言列表（支援分頁）
- 提供篩選功能（全部、待處理、已顯示、已隱藏）
- 提供留言操作（標記已處理、隱藏）
- Optimistic UI：操作後立即更新介面

#### Scenario: 載入收件匣

- **WHEN** 已登入的直播主訪問 `/dashboard/inbox`
- **THEN** 系統顯示該直播主的留言列表
- **AND** 預設顯示全部留言

#### Scenario: 篩選留言

- **WHEN** 直播主點擊篩選按鈕（如「待處理」）
- **THEN** 列表僅顯示對應狀態的留言

#### Scenario: 標記留言為已處理

- **WHEN** 直播主點擊留言的「標記已處理」按鈕
- **THEN** 介面立即更新該留言狀態（Optimistic UI）
- **AND** 背景發送 API 請求
- **AND** 若 API 失敗，回滾至原狀態並顯示錯誤

#### Scenario: 隱藏留言

- **WHEN** 直播主點擊留言的「隱藏」按鈕
- **THEN** 介面立即更新該留言狀態（Optimistic UI）
- **AND** 背景發送 API 請求
- **AND** 若 API 失敗，回滾至原狀態並顯示錯誤

#### Scenario: 載入更多留言

- **WHEN** 直播主點擊「載入更多」按鈕
- **THEN** 系統載入下一頁留言
- **AND** 附加至現有列表

#### Scenario: 重新整理

- **WHEN** 直播主點擊「重新整理」按鈕
- **THEN** 系統重新載入留言列表
