import { z } from 'zod/v4'
import { eq } from 'drizzle-orm'
import { questions, projects } from '../../../database/schema'

const schema = z.object({
  status: z.enum(['visible', 'hidden']),
})

// Valid state transitions
const validTransitions: Record<string, string[]> = {
  pending: ['visible', 'hidden'],
  visible: ['hidden'],
  hidden: [], // Cannot transition from hidden
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  // Get question ID from route params
  const id = getRouterParam(event, 'id')
  if (!id || Number.isNaN(parseInt(id, 10))) {
    throw createError({
      statusCode: 400,
      statusMessage: '留言 ID 格式不正確',
    })
  }

  const questionId = parseInt(id, 10)

  // Parse and validate body
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '驗證失敗',
    })
  }

  const { status: newStatus } = result.data

  // Get user's project IDs
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.streamerId, user.id),
    columns: { id: true },
  })

  const projectIds = userProjects.map(p => p.id)

  // Find the question
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })

  if (!question) {
    throw createError({
      statusCode: 404,
      statusMessage: '留言不存在',
    })
  }

  // Check permission
  if (!projectIds.includes(question.projectId)) {
    throw createError({
      statusCode: 403,
      statusMessage: '無權限操作此留言',
    })
  }

  // Check valid state transition
  const allowedTransitions = validTransitions[question.status] ?? []
  if (!allowedTransitions.includes(newStatus)) {
    throw createError({
      statusCode: 422,
      statusMessage: `不允許從 ${question.status} 狀態轉換為 ${newStatus}`,
    })
  }

  // Update the question
  const [updatedQuestion] = await db
    .update(questions)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId))
    .returning()

  return { question: updatedQuestion }
})
