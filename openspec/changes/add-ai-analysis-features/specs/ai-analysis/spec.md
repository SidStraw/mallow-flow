## ADDED Requirements

### Requirement: AI 內容審核

系統 SHALL 在觀眾提交留言時進行 AI 內容審核，以偵測並阻擋惡意、攻擊性或不當內容。

#### Scenario: 留言通過內容審核
- **WHEN** 觀眾提交一則正常留言
- **THEN** AI 審核判定為 pass
- **AND** 系統發放 `validation_token`
- **AND** 觀眾可進入付款流程

#### Scenario: 留言被內容審核拒絕
- **WHEN** 觀眾提交一則包含惡意內容的留言
- **THEN** AI 審核判定為 reject
- **AND** 系統顯示友善的拒絕訊息
- **AND** 留言不進入付款流程
- **AND** 系統記錄拒絕原因至 `ai_review_reason` 欄位

#### Scenario: AI 審核服務不可用
- **WHEN** AI API 呼叫失敗或超時
- **THEN** 系統設定 `ai_review_status` 為 'pending'
- **AND** 留言仍可進入付款流程（fail-open）
- **AND** 系統記錄錯誤日誌

---

### Requirement: AI 情緒分析

系統 SHALL 為 Premium 直播主的留言提供情緒分析功能，輸出 0 至 1 的情緒分數。

#### Scenario: Premium 直播主查看情緒分數
- **WHEN** Premium 直播主收到一則留言
- **THEN** 系統自動分析留言情緒
- **AND** 結果儲存至 `sentiment_score` 欄位
- **AND** 直播主可在收件匣查看情緒指標

#### Scenario: Free 直播主無法使用情緒分析
- **WHEN** Free 直播主收到一則留言
- **THEN** 系統不執行情緒分析
- **AND** `sentiment_score` 欄位為 null

#### Scenario: 情緒分數解讀
- **WHEN** 留言情緒為負面
- **THEN** `sentiment_score` 接近 0
- **WHEN** 留言情緒為中性
- **THEN** `sentiment_score` 接近 0.5
- **WHEN** 留言情緒為正面
- **THEN** `sentiment_score` 接近 1

---

### Requirement: AI 自動標籤

系統 SHALL 為 Premium 直播主的留言自動分類並標記主題標籤。

#### Scenario: 留言自動標記標籤
- **WHEN** Premium 直播主收到一則留言
- **THEN** 系統自動分析並標記適當標籤
- **AND** 標籤儲存至 `ai_tags` 欄位（JSONB 陣列）
- **AND** 支援多標籤

#### Scenario: 預設標籤類型
- **WHEN** 系統分析留言主題
- **THEN** 可標記的標籤包含：問題、建議、閒聊、點歌、感謝、其他

#### Scenario: Free 直播主無法使用自動標籤
- **WHEN** Free 直播主收到一則留言
- **THEN** 系統不執行自動標籤
- **AND** `ai_tags` 欄位為 null

---

### Requirement: AI 自動摘要

系統 SHALL 為 Premium 直播主的長留言自動產生簡短摘要。

#### Scenario: 長留言自動產生摘要
- **WHEN** Premium 直播主收到一則超過 100 字的留言
- **THEN** 系統自動產生 50 字以內的摘要
- **AND** 摘要儲存至 `ai_summary` 欄位

#### Scenario: 短留言不產生摘要
- **WHEN** Premium 直播主收到一則 100 字以內的留言
- **THEN** 系統不執行自動摘要
- **AND** `ai_summary` 欄位為 null

#### Scenario: Free 直播主無法使用自動摘要
- **WHEN** Free 直播主收到一則留言
- **THEN** 系統不執行自動摘要
- **AND** `ai_summary` 欄位為 null

---

### Requirement: AI 使用量追蹤

系統 SHALL 追蹤每個直播主的 AI 功能使用量與成本。

#### Scenario: 記錄 AI 呼叫資訊
- **WHEN** 系統執行任何 AI 功能
- **THEN** 系統記錄至 `AiUsageLogs` 表
- **AND** 記錄包含：直播主 ID、模型名稱、輸入 token 數、輸出 token 數、計算成本、功能類型、時間戳記

#### Scenario: 查詢 AI 使用量統計
- **WHEN** 直播主存取 `/api/streamer/ai-usage` 端點
- **THEN** 系統回傳當月使用量統計
- **AND** 包含總成本、各功能使用次數、token 使用量

---

### Requirement: AI 配額監控

系統 SHALL 監控每個 Premium 直播主的 AI 使用配額，並在超額時發送通知。

#### Scenario: 配額內正常使用
- **WHEN** Premium 直播主當月 AI 使用成本低於 3 USD
- **THEN** AI 功能正常運作
- **AND** 不產生警告

#### Scenario: 配額超額通知
- **WHEN** Premium 直播主當月 AI 使用成本超過 3 USD
- **THEN** 系統記錄 warn level 日誌
- **AND** 通知開發者查閱
- **AND** AI 功能繼續運作（不停用）

---

### Requirement: AI 分析 API

系統 SHALL 提供 API 端點供前端呼叫 AI 分析功能。

#### Scenario: 呼叫內容審核 API
- **WHEN** 前端呼叫 `POST /api/ai/moderate`
- **AND** 請求包含留言內容
- **THEN** 系統執行 AI 內容審核
- **AND** 回傳 `{ pass: boolean, reason?: string, validationToken?: string }`

#### Scenario: 呼叫完整 AI 分析 API
- **WHEN** 前端呼叫 `POST /api/ai/analyze`
- **AND** 請求包含留言 ID
- **AND** 請求者為 Premium 直播主
- **THEN** 系統執行情緒分析、自動標籤、自動摘要
- **AND** 回傳 `{ sentiment: number, tags: string[], summary?: string }`

#### Scenario: 非 Premium 用戶呼叫分析 API
- **WHEN** 前端呼叫 `POST /api/ai/analyze`
- **AND** 請求者為 Free 直播主
- **THEN** 系統回傳 403 Forbidden 錯誤

---

### Requirement: AI 降級策略

系統 SHALL 在 AI 服務不可用時實施降級策略，確保核心流程不中斷。

#### Scenario: 內容審核降級
- **WHEN** AI 內容審核服務不可用
- **THEN** 系統設定 `ai_review_status` 為 'pending'
- **AND** 留言進入人工審核佇列
- **AND** 付款流程可繼續進行

#### Scenario: Premium 功能降級
- **WHEN** AI 情緒/標籤/摘要服務不可用
- **THEN** 對應欄位設為 null
- **AND** 不阻擋留言流程
- **AND** 系統記錄錯誤日誌

#### Scenario: AI 呼叫重試
- **WHEN** AI API 呼叫失敗
- **THEN** 系統最多重試 2 次
- **AND** 使用指數退避策略
- **AND** 重試呼叫納入配額計算
