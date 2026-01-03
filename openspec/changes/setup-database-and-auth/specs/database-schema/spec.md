## ADDED Requirements

### Requirement: Streamer 資料表結構

系統 **SHALL** 提供 `streamers` 資料表，包含以下欄位：

| 欄位 | 型別 | 說明 |
|-----|-----|-----|
| `id` | Text (PK) | Auth Provider ID |
| `email` | Text (Unique) | 電子郵件 |
| `slug` | Text (Unique, Nullable) | 個人網址 |
| `points_balance` | Integer | 點數餘額，預設 0 |
| `subscription_expires_at` | Timestamp (Nullable) | AI 功能到期時間 |
| `subscription_anchor_day` | Integer (Nullable) | 錨點日期 (1-31) |
| `is_accepting_post` | Boolean | 全局投稿開關，預設 true |
| `active_tier` | Text | 訂閱層級 ('free' 或 'premium')，預設 'free' |
| `platform_identity` | JSONB (Nullable) | Twitch/YT Channel ID |
| `created_at` | Timestamp | 建立時間 |
| `updated_at` | Timestamp | 更新時間 |

#### Scenario: 建立新直播主記錄

- **WHEN** 系統建立新直播主記錄
- **THEN** `points_balance` 預設為 0
- **AND** `is_accepting_post` 預設為 true
- **AND** `active_tier` 預設為 'free'
- **AND** `created_at` 與 `updated_at` 自動設定為當前時間

#### Scenario: Email 唯一性約束

- **WHEN** 嘗試建立重複 email 的直播主記錄
- **THEN** 資料庫 **SHALL** 拒絕插入並回傳唯一性約束錯誤

### Requirement: Project 資料表結構

系統 **SHALL** 提供 `projects` 資料表，包含以下欄位：

| 欄位 | 型別 | 說明 |
|-----|-----|-----|
| `id` | UUID (PK) | 專案 ID |
| `streamer_id` | Text (FK) | 關聯直播主 |
| `name` | Text | 專案名稱 |
| `is_default` | Boolean | 是否為預設專案 |
| `is_active` | Boolean | 是否啟用中 |
| `deleted_at` | Timestamp (Nullable) | 軟刪除時間 |
| `created_at` | Timestamp | 建立時間 |
| `updated_at` | Timestamp | 更新時間 |

#### Scenario: 專案關聯外鍵約束

- **WHEN** 建立專案時指定不存在的 `streamer_id`
- **THEN** 資料庫 **SHALL** 拒絕插入並回傳外鍵約束錯誤

#### Scenario: 軟刪除專案

- **WHEN** 刪除有關聯留言的專案
- **THEN** 系統 **SHALL** 設定 `deleted_at` 為當前時間
- **AND** 系統 **SHALL NOT** 實際刪除資料列

### Requirement: 資料庫連線

系統 **SHALL** 使用 Drizzle ORM 連接 PostgreSQL 資料庫。

#### Scenario: 連線池管理

- **WHEN** 系統部署於 Cloudflare Workers
- **THEN** 系統 **SHALL** 透過 Hyperdrive 管理資料庫連線池
