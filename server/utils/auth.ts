import type { H3Event } from 'h3'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: '請先登入',
    })
  }

  return session.user as AuthUser
}
