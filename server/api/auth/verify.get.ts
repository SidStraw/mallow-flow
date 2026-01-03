import { eq } from 'drizzle-orm'
import { streamers, projects } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少驗證 token',
    })
  }

  const payload = await verifyMagicLinkToken(token)
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: '無效或已過期的連結',
    })
  }

  const db = useDb()
  const { email } = payload

  // 查找或建立直播主
  let streamer = await db.query.streamers.findFirst({
    where: eq(streamers.email, email),
  })

  if (!streamer) {
    // 建立新直播主
    const [newStreamer] = await db.insert(streamers).values({
      email,
    }).returning()

    if (!newStreamer) {
      throw createError({
        statusCode: 500,
        statusMessage: '建立帳戶失敗',
      })
    }

    streamer = newStreamer

    // 建立預設專案
    await db.insert(projects).values({
      streamerId: streamer.id,
      name: '預設專案',
      description: '自動建立的預設專案',
      isDefault: true,
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

  // 重導向至首頁
  const config = useRuntimeConfig()
  return sendRedirect(event, config.public.appUrl)
})
