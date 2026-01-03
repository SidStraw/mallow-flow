import { z } from 'zod/v4'
import { eq, and } from 'drizzle-orm'
import { projects } from '../../database/schema'

const schema = z.object({
  name: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱不能超過 100 字').optional(),
  description: z.string().max(500, '專案描述不能超過 500 字').optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少專案 ID',
    })
  }

  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? '驗證失敗',
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

  const { name, description } = result.data
  const updateData: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description

  const [updated] = await db.update(projects)
    .set(updateData)
    .where(eq(projects.id, id))
    .returning()

  return { project: updated }
})
