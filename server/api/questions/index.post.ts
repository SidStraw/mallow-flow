import { z } from 'zod/v4'
import { eq } from 'drizzle-orm'
import { questions, projects } from '../../database/schema'
import { generateAnonymousName } from '../../utils/anonymous-name'
import { checkRateLimit, getClientIp } from '../../utils/rate-limit'

const schema = z.object({
  projectId: z.string().uuid('專案 ID 格式不正確'),
  content: z
    .string()
    .min(10, '留言內容至少需要 10 個字')
    .max(500, '留言內容不能超過 500 個字'),
  displayName: z.string().max(50, '暱稱不能超過 50 個字').optional(),
})

export default defineEventHandler(async (event) => {
  // Rate limiting
  const ip = getClientIp(event)
  const rateLimit = checkRateLimit(ip)

  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: '投稿太頻繁，請稍後再試',
    })
  }

  // Parse and validate body
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '驗證失敗',
    })
  }

  const { projectId, content, displayName } = result.data
  const db = useDb()

  // Verify project exists
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: '專案不存在',
    })
  }

  // Create question
  const [question] = await db.insert(questions).values({
    projectId,
    content,
    displayName: displayName || generateAnonymousName(),
    status: 'pending',
  }).returning()

  setResponseStatus(event, 201)
  return { question }
})
