import { z } from 'zod/v4'
import { eq, and, desc, inArray, sql, lt, or } from 'drizzle-orm'
import { questions, projects } from '../../database/schema'

const querySchema = z.object({
  status: z.enum(['all', 'pending', 'visible', 'hidden']).default('all'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  // Parse query params
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? '查詢參數錯誤',
    })
  }

  const { status, cursor, limit } = result.data

  // Get all project IDs for this streamer
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.streamerId, user.id),
    columns: { id: true },
  })

  if (userProjects.length === 0) {
    return { questions: [], nextCursor: null }
  }

  const projectIds = userProjects.map(p => p.id)

  // Build conditions
  const conditions = [inArray(questions.projectId, projectIds)]

  if (status !== 'all') {
    conditions.push(eq(questions.status, status))
  }

  // Parse cursor (format: "timestamp:id")
  if (cursor) {
    const lastColonIndex = cursor.lastIndexOf(':')
    if (lastColonIndex !== -1) {
      const cursorTimestamp = cursor.substring(0, lastColonIndex)
      const cursorId = parseInt(cursor.substring(lastColonIndex + 1), 10)
      const cursorDate = new Date(cursorTimestamp)
      if (!Number.isNaN(cursorDate.getTime()) && !Number.isNaN(cursorId)) {
        // (created_at, id) < (cursorDate, cursorId) using row comparison
        conditions.push(
          or(
            lt(questions.createdAt, cursorDate),
            and(
              eq(questions.createdAt, cursorDate),
              lt(questions.id, cursorId),
            ),
          )!,
        )
      }
    }
  }

  // Fetch questions with one extra to determine if there's a next page
  const questionList = await db.query.questions.findMany({
    where: and(...conditions),
    orderBy: [desc(questions.createdAt), desc(questions.id)],
    limit: limit + 1,
    with: {
      project: {
        columns: { id: true, name: true },
      },
    },
  })

  // Check if there's more data
  const hasMore = questionList.length > limit
  const items = hasMore ? questionList.slice(0, limit) : questionList

  // Generate next cursor
  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1]!
    nextCursor = `${lastItem.createdAt.toISOString()}:${lastItem.id}`
  }

  return { questions: items, nextCursor }
})
