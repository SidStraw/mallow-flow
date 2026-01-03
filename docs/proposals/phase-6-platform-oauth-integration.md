# Phase 6: 直播平台整合提案提示詞

請幫我建立 OpenSpec 變更提案：

## Change ID

`add-platform-oauth-integration`

## 目標

支援 YouTube/Twitch OAuth 驗證，實作會員等級驗證功能。

### 具體交付項目

1. **資料庫 Schema 擴充**
   - `Streamers` 表更新 `platform_identity` JSONB 欄位結構：
     ```typescript
     {
       youtube?: {
         channelId: string;
         accessToken: string;
         refreshToken: string;
         expiresAt: Date;
       };
       twitch?: {
         broadcasterId: string;
         accessToken: string;
         refreshToken: string;
         expiresAt: Date;
       };
     }
     ```
   - `Viewers` 表擴充：
     - `platform_id` (Text) - YouTube User ID 或 Twitch User ID
     - `platform_type` (Text) - 'youtube', 'twitch', 'anonymous'
     - `display_name` (Text) - 平台顯示名稱
   - `Questions` 表擴充：
     - `member_tier` (Integer) - 會員等級 (0=非會員, 1=Tier1, 2=Tier2, 3=Tier3)
     - `member_tier_metadata` (JSONB) - 儲存 YouTube levelId 或 Twitch tier 詳細資訊

2. **直播主平台連接**
   - YouTube OAuth 連接（頻道擁有者驗證）
   - Twitch OAuth 連接（頻道擁有者驗證）
   - 已連接平台顯示在設定頁面
   - 支援取消連接

3. **觀眾會員驗證**
   - 觀眾投稿時選擇驗證身份
   - YouTube 會員驗證 flow
   - Twitch 訂閱者驗證 flow
   - 驗證成功後取得會員等級
   - 會員等級顯示在留言卡片

4. **會員限制投稿**
   - 直播主可設定最低會員等級要求
   - 未達標準時顯示提示訊息
   - 允許同時匿名投稿（若直播主開啟）

5. **API 快取機制**
   - 會員等級查詢結果快取
   - 快取時間：5 分鐘
   - 使用 KV Storage 或 Memory Cache

6. **API Endpoints**
   - `GET /api/oauth/youtube/connect` - 開始 YouTube OAuth
   - `GET /api/oauth/youtube/callback` - YouTube OAuth 回調
   - `GET /api/oauth/twitch/connect` - 開始 Twitch OAuth
   - `GET /api/oauth/twitch/callback` - Twitch OAuth 回調
   - `POST /api/viewer/verify-membership` - 驗證觀眾會員等級
   - `DELETE /api/oauth/:platform/disconnect` - 取消平台連接

## 技術規範

### YouTube API 整合

- **API**: YouTube Data API v3 + YouTube Membership API
- **Scopes**: 
  - `youtube.readonly` - 頻道資訊
  - `youtube.channel-memberships.creator` - 會員資訊
- **配額**: 每日 10,000 units
- **會員等級對應**:
  - 以 `levelId` 為主鍵
  - 建立 levelId ↔ 等級名稱對應表

### Twitch API 整合

- **API**: Twitch Helix API
- **Scopes**:
  - `channel:read:subscriptions` - 讀取訂閱者
  - `user:read:subscriptions` - 讀取用戶訂閱
- **Rate Limit**: 800 requests/min
- **會員等級對應**:
  - Tier 1 = 1, Tier 2 = 2, Tier 3 = 3

### OAuth Flow

```
直播主連接平台:
1. 點擊「連接 YouTube」
2. 重導向至 Google OAuth
3. 授權後回調至 /api/oauth/youtube/callback
4. 儲存 tokens 至 platform_identity
5. 顯示連接成功

觀眾驗證會員:
1. 投稿時點擊「驗證會員身份」
2. 重導向至平台 OAuth
3. 授權後回調並查詢會員等級
4. 將會員等級寫入 Questions.member_tier
```

### Token 管理

- Access Token 過期時自動 refresh
- Refresh Token 失效時通知直播主重新連接
- 敏感 token 加密儲存

## 依賴

- `add-core-messaging-flow`（需先有基本投稿功能）

## 驗收標準

### 功能驗收

- [ ] 直播主可以連接 YouTube 帳號
- [ ] 直播主可以連接 Twitch 帳號
- [ ] 觀眾投稿時可以驗證會員身份
- [ ] 會員等級正確顯示在留言卡片上
- [ ] 會員限制投稿正常運作
- [ ] 可以取消平台連接

### 技術驗收

- [ ] TypeScript 型別檢查通過
- [ ] ESLint 檢查通過
- [ ] OAuth flow 安全實作（state 參數驗證）
- [ ] Token refresh 正常運作
- [ ] API 快取命中率 > 80%
- [ ] 單元測試覆蓋 OAuth 邏輯

## 風險與注意事項

1. **YouTube API 配額**
   - 每日 10,000 units 限制
   - Membership API 查詢成本較高
   - 需實作快取策略

2. **OAuth Token 過期**
   - YouTube: Access Token 1 小時過期
   - Twitch: Access Token 4 小時過期
   - 需實作自動 refresh 機制

3. **平台 API 變更**
   - 直播平台可能變更 API 格式
   - 建立 adapter pattern 隔離平台差異

4. **會員等級變動**
   - 會員可能在投稿後取消訂閱
   - 記錄投稿當下的會員等級，不追蹤後續變動

## 上下文參考

### 直播平台整合（來自 project.md）

#### YouTube
- **會員驗證優先順序**: 優先支援
- **會員等級對應**: 以 `levelId` 為主鍵
- **API**: YouTube Data API v3 + YouTube Membership API

#### Twitch
- **會員驗證優先順序**: 同時支援
- **會員等級對應**: Tier 1/2/3 對應至 member_tier 1/2/3
- **API**: Twitch Helix API

### 驗證策略（來自 project.md）

- **Streamer**: OAuth (YouTube/Twitch) 驗證頻道權限
- **Viewer**: OAuth 驗證會員身份
- **會員限制功能**: 僅在 OAuth 連接成功後才可啟用

---

請產生 `proposal.md`、`tasks.md`、`design.md`（因為有跨平台 OAuth 整合的技術決策）和 `spec.deltas.md`，建立 `platform-integration` capability 的 specs。
