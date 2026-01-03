# Tasks: add-platform-oauth-integration

## 1. 資料庫 Schema 擴充

- [ ] 1.1 擴充 `Streamers.platform_identity` JSONB 結構定義
- [ ] 1.2 擴充 `Viewers` 表新增 `platform_id`、`platform_type`、`display_name` 欄位
- [ ] 1.3 擴充 `Questions` 表新增 `member_tier`、`member_tier_metadata` 欄位
- [ ] 1.4 執行 Drizzle migrations 並驗證

## 2. OAuth 基礎設施

- [ ] 2.1 建立 OAuth state 驗證機制（防 CSRF）
- [ ] 2.2 建立 token 加密儲存工具（`server/utils/token-encryption.ts`）
- [ ] 2.3 建立 token refresh 機制
- [ ] 2.4 單元測試 OAuth 相關工具函式

## 3. YouTube OAuth 整合

- [ ] 3.1 實作 `GET /api/oauth/youtube/connect` - 開始 OAuth
- [ ] 3.2 實作 `GET /api/oauth/youtube/callback` - OAuth 回調
- [ ] 3.3 實作 YouTube Membership API 查詢會員等級
- [ ] 3.4 實作 token auto-refresh middleware
- [ ] 3.5 單元測試 YouTube OAuth 流程

## 4. Twitch OAuth 整合

- [ ] 4.1 實作 `GET /api/oauth/twitch/connect` - 開始 OAuth
- [ ] 4.2 實作 `GET /api/oauth/twitch/callback` - OAuth 回調
- [ ] 4.3 實作 Twitch Helix API 查詢訂閱等級
- [ ] 4.4 實作 token auto-refresh middleware
- [ ] 4.5 單元測試 Twitch OAuth 流程

## 5. 平台連接管理

- [ ] 5.1 實作 `DELETE /api/oauth/:platform/disconnect` - 取消連接
- [ ] 5.2 建立設定頁面已連接平台列表 UI
- [ ] 5.3 建立「連接平台」按鈕與流程
- [ ] 5.4 建立「取消連接」確認對話框
- [ ] 5.5 組件測試設定頁面

## 6. 觀眾會員驗證

- [ ] 6.1 實作 `POST /api/viewer/verify-membership` - 驗證會員等級
- [ ] 6.2 建立觀眾 OAuth 驗證流程（sessionless）
- [ ] 6.3 擴充投稿表單加入「驗證會員身份」選項
- [ ] 6.4 建立會員驗證成功/失敗 UI 回饋
- [ ] 6.5 單元測試會員驗證邏輯

## 7. API 快取機制

- [ ] 7.1 建立會員等級查詢快取（5 分鐘 TTL）
- [ ] 7.2 選擇快取策略：Memory Cache 或 Cloudflare KV
- [ ] 7.3 實作快取 invalidation 機制
- [ ] 7.4 單元測試快取邏輯

## 8. 會員限制功能

- [ ] 8.1 擴充 `Projects` 表新增 `min_member_tier` 欄位
- [ ] 8.2 建立設定頁面會員限制設定 UI
- [ ] 8.3 投稿時檢查會員等級是否達標
- [ ] 8.4 未達標時顯示友善提示訊息
- [ ] 8.5 組件測試會員限制流程

## 9. 留言卡片會員顯示

- [ ] 9.1 擴充 `QuestionCard` 組件顯示會員等級 badge
- [ ] 9.2 設計會員等級 badge 樣式（Tier 1/2/3）
- [ ] 9.3 組件測試會員顯示

## 10. E2E 測試與驗收

- [ ] 10.1 E2E 測試：直播主連接 YouTube
- [ ] 10.2 E2E 測試：直播主連接 Twitch
- [ ] 10.3 E2E 測試：觀眾驗證會員投稿
- [ ] 10.4 E2E 測試：會員限制投稿拒絕
- [ ] 10.5 E2E 測試：取消平台連接
- [ ] 10.6 執行 TypeScript 型別檢查
- [ ] 10.7 執行 ESLint 檢查
