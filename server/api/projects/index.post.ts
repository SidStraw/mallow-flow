import { z } from 'zod/v4'
import { projects } from '../../database/schema'

const schema = z.object({
  name: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱不能超過 100 字'),
  description: z.string().max(500, '專案描述不能超過 500 字').optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? '驗證失敗',
    })
  }

  const db = useDb()
  const { name, description } = result.data

  const [project] = await db.insert(projects).values({
    streamerId: user.id,
    name,
    description,
    isDefault: false,
  }).returning()

  return { project }
})
