import { eq } from 'drizzle-orm'
import { streamers, projects } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug 為必填',
    })
  }

  const db = useDb()

  // Find streamer by slug
  const streamer = await db.query.streamers.findFirst({
    where: eq(streamers.slug, slug),
    columns: {
      id: true,
      displayName: true,
      avatarUrl: true,
      slug: true,
    },
  })

  if (!streamer) {
    throw createError({
      statusCode: 404,
      statusMessage: '找不到該直播主',
    })
  }

  // Get active projects for this streamer
  const streamerProjects = await db.query.projects.findMany({
    where: eq(projects.streamerId, streamer.id),
    columns: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: (projects, { desc }) => [desc(projects.isDefault), desc(projects.createdAt)],
  })

  return {
    streamer,
    projects: streamerProjects,
  }
})
