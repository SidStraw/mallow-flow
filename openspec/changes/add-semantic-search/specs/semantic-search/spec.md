## ADDED Requirements

### Requirement: Embedding 向量化處理

系統 SHALL 在留言建立時自動產生 embedding 向量，用於語意搜尋。

- 使用 `text-embedding-3-small` 模型 (維度 1536)
- 非同步處理，不阻擋投稿流程
- embedding 儲存於 `Questions.embedding` 欄位

#### Scenario: 留言投稿後產生 embedding

- **WHEN** 觀眾成功投稿一則留言
- **THEN** 系統發送 embedding 產生任務至 queue
- **AND** embedding 在 5 秒內產生完成
- **AND** 留言可被語意搜尋

#### Scenario: embedding 產生失敗重試

- **WHEN** embedding API 呼叫失敗
- **THEN** 系統最多重試 3 次
- **AND** 重試間隔採用指數退避 (1s, 2s, 4s)
- **AND** 若仍失敗，記錄錯誤日誌並標記留言為待處理

#### Scenario: 歷史留言批次處理

- **WHEN** 管理員執行歷史 embedding 補建 script
- **THEN** 系統批次處理 (每批 100 筆)
- **AND** 尊重 API rate limit
- **AND** 支援斷點續傳

---

### Requirement: 語意搜尋 API

系統 SHALL 提供語意搜尋 API，允許直播主使用自然語言搜尋留言。

- API 路徑: `GET /api/search`
- 搜尋範圍: 單一直播主 (project_id) 的所有留言
- 回傳相似度分數與排序結果
- 僅 Premium Tier 可使用

#### Scenario: 成功執行語意搜尋

- **GIVEN** 直播主已訂閱 Premium Tier
- **AND** 直播主有至少 10 則已產生 embedding 的留言
- **WHEN** 直播主搜尋「遊戲推薦」
- **THEN** 系統回傳相關遊戲討論留言
- **AND** 結果按相似度降序排列
- **AND** 每筆結果包含 similarity 分數 (0-1)
- **AND** 回應時間 < 500ms

#### Scenario: 搜尋結果分頁

- **GIVEN** 搜尋結果超過單頁數量 (預設 20 筆)
- **WHEN** 直播主請求下一頁
- **THEN** 系統回傳 cursor-based 分頁資訊
- **AND** 可繼續載入後續結果

#### Scenario: 非 Premium 使用者嘗試搜尋

- **GIVEN** 直播主為 Free Tier
- **WHEN** 直播主呼叫搜尋 API
- **THEN** 系統回傳 403 Forbidden
- **AND** 錯誤訊息說明需升級至 Premium

#### Scenario: 空搜尋結果

- **GIVEN** 搜尋關鍵字與現有留言無語意相關性
- **WHEN** 直播主執行搜尋
- **THEN** 系統回傳空陣列
- **AND** 回應包含提示訊息「無符合條件的留言」

---

### Requirement: 搜尋介面

系統 SHALL 提供直播主後台搜尋介面，支援即時搜尋與結果顯示。

- 位於直播主後台收件匣頁面
- 即時搜尋 (debounce 300ms)
- 顯示相似度指標
- Premium 功能正確鎖定

#### Scenario: 即時搜尋輸入

- **GIVEN** 直播主在搜尋欄位輸入文字
- **WHEN** 停止輸入超過 300ms
- **THEN** 系統自動發送搜尋請求
- **AND** 顯示載入狀態
- **AND** 結果顯示後更新列表

#### Scenario: 搜尋結果顯示

- **GIVEN** 搜尋回傳多筆結果
- **WHEN** 結果顯示於介面
- **THEN** 每筆結果顯示留言內容摘要
- **AND** 顯示相似度百分比 (如 95%)
- **AND** 搜尋關鍵字高亮顯示

#### Scenario: Free Tier 搜尋鎖定

- **GIVEN** 直播主為 Free Tier
- **WHEN** 直播主檢視搜尋功能
- **THEN** 搜尋欄位顯示 Premium 鎖定圖示
- **AND** 點擊時顯示升級提示

---

### Requirement: Embedding 成本監控

系統 SHALL 監控 embedding API 使用量，避免成本超出預算。

- 追蹤每直播主 embedding 產生次數與 token 使用量
- 設定每日產生上限
- 超額時發送告警，不停用服務

#### Scenario: 達到每日產生上限

- **GIVEN** 直播主今日已產生 500 筆 embedding
- **WHEN** 新留言投稿
- **THEN** 系統記錄 `warn` level 日誌
- **AND** 發送告警通知開發者
- **AND** 繼續產生 embedding (不停用)

#### Scenario: 每日配額重置

- **WHEN** UTC 00:00
- **THEN** 所有直播主每日配額計數器重置
