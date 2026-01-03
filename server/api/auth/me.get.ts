export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入',
    })
  }

  return {
    user: session.user,
    loggedInAt: session.loggedInAt,
  }
})
