import { eq, and } from 'drizzle-orm'
import { projects } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少專案 ID',
    })
  }

  const db = useDb()

  // 確認專案存在且屬於此使用者
  const existing = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.streamerId, user.id)),
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: '專案不存在',
    })
  }

  // 預設專案不可刪除
  if (existing.isDefault) {
    throw createError({
      statusCode: 400,
      statusMessage: '預設專案不可刪除',
    })
  }

  await db.delete(projects).where(eq(projects.id, id))

  return { success: true }
})
