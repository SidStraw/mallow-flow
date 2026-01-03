import { SignJWT, jwtVerify } from 'jose'

const MAGIC_LINK_EXPIRY = 15 * 60 // 15 分鐘

interface MagicLinkPayload {
  email: string
  type: 'magic-link'
}

export async function createMagicLinkToken(email: string): Promise<string> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.sessionSecret)

  const token = await new SignJWT({ email, type: 'magic-link' } satisfies MagicLinkPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${MAGIC_LINK_EXPIRY}s`)
    .setIssuedAt()
    .sign(secret)

  return token
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
  try {
    const config = useRuntimeConfig()
    const secret = new TextEncoder().encode(config.sessionSecret)

    const { payload } = await jwtVerify(token, secret)

    if (payload.type !== 'magic-link' || typeof payload.email !== 'string') {
      return null
    }

    return { email: payload.email, type: 'magic-link' }
  }
  catch {
    return null
  }
}
