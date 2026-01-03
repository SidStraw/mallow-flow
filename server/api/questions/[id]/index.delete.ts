import { eq } from 'drizzle-orm'
import { questions, projects } from '../../../database/schema'

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

  // Soft delete: set is_hidden_by_streamer = true and status = 'hidden'
  const [updatedQuestion] = await db
    .update(questions)
    .set({
      isHiddenByStreamer: true,
      status: 'hidden',
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId))
    .returning()

  return { question: updatedQuestion }
})
