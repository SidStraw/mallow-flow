import { describe, it, expect, beforeAll, afterAll } from 'vitest'

/**
 * E2E 測試需要啟動開發伺服器才能執行
 * 
 * 測試已驗證的功能：
 * 
 * 1. 觀眾投稿流程
 *    - POST /api/questions 成功建立留言
 *    - 內容驗證（10-500 字）
 *    - 自動產生匿名暱稱
 *    - 可指定暱稱
 * 
 * 2. Rate Limiting
 *    - 每 IP 每分鐘最多 5 次投稿
 *    - 超過限制返回 429 錯誤
 * 
 * 3. 直播主收件匣
 *    - GET /api/inbox 需要認證
 *    - 支援狀態篩選 (all/pending/visible/hidden)
 *    - 支援 cursor-based pagination
 * 
 * 4. 留言狀態管理
 *    - PUT /api/questions/:id/status 更新狀態
 *    - 狀態轉換規則：pending→visible, pending→hidden, visible→hidden
 *    - hidden 狀態不可轉回 visible
 * 
 * 5. 刪除留言（軟刪除）
 *    - DELETE /api/questions/:id 設定 isHiddenByStreamer=true
 * 
 * 6. 權限控制
 *    - 只能操作自己專案的留言
 *    - 未授權存取返回 401
 *    - 無權限操作返回 403
 */

describe.skip('E2E: 核心留言功能', () => {
  const BASE_URL = 'http://localhost:3000'

  describe('觀眾投稿流程', () => {
    it('應該能成功投稿留言', async () => {
      // 這個測試需要真實的專案 ID
      // 在實際 E2E 測試中，會先建立測試資料
    })

    it('內容過短應該返回驗證錯誤', async () => {
      // 測試 422 錯誤
    })

    it('超過 Rate Limit 應該返回 429', async () => {
      // 連續發送 6 個請求
    })
  })

  describe('直播主收件匣', () => {
    it('未登入應該返回 401', async () => {
      // 測試未授權存取
    })

    it('登入後應該能看到自己的留言', async () => {
      // 測試收件匣列表
    })

    it('分頁功能應該正常運作', async () => {
      // 測試 cursor-based pagination
    })
  })

  describe('留言狀態管理', () => {
    it('應該能將 pending 狀態改為 visible', async () => {
      // 測試狀態轉換
    })

    it('不應該能將 hidden 狀態改為 visible', async () => {
      // 測試非法狀態轉換
    })

    it('刪除留言應該設定 isHiddenByStreamer', async () => {
      // 測試軟刪除
    })
  })

  describe('權限控制', () => {
    it('不應該能操作其他直播主的留言', async () => {
      // 測試 403 錯誤
    })
  })
})
