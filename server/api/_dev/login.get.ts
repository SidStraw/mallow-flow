import { eq } from 'drizzle-orm'
import { streamers } from '../../database/schema'

// 開發模式專用的快速登入 API
export default defineEventHandler(async (event) => {
  // 只在開發模式下可用
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    })
  }

  const query = getQuery(event)
  const email = query.email as string

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: '請提供 email',
    })
  }

  const db = useDb()

  const streamer = await db.query.streamers.findFirst({
    where: eq(streamers.email, email),
  })

  if (!streamer) {
    throw createError({
      statusCode: 404,
      statusMessage: '找不到該直播主',
    })
  }

  // 設定 session
  await setUserSession(event, {
    user: {
      id: streamer.id,
      email: streamer.email,
      displayName: streamer.displayName,
      avatarUrl: streamer.avatarUrl,
    },
    loggedInAt: Date.now(),
  })

  return { success: true, user: { id: streamer.id, email: streamer.email } }
})
