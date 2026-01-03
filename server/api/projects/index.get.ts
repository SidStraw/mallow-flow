import { eq, and } from 'drizzle-orm'
import { projects } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.streamerId, user.id),
    orderBy: (projects, { desc }) => [desc(projects.isDefault), desc(projects.createdAt)],
  })

  return { projects: userProjects }
})
