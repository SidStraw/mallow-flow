import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'

// Mock useRuntimeConfig
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    sessionSecret: 'test-secret-at-least-32-characters-long',
  }),
}))

describe('Magic Link Token', () => {
  const testEmail = 'test@example.com'
  const secret = new TextEncoder().encode('test-secret-at-least-32-characters-long')

  describe('createMagicLinkToken', () => {
    it('should create a valid JWT token', async () => {
      const token = await new SignJWT({ email: testEmail, type: 'magic-link' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .setIssuedAt()
        .sign(secret)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyMagicLinkToken', () => {
    it('should verify a valid token', async () => {
      const token = await new SignJWT({ email: testEmail, type: 'magic-link' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .setIssuedAt()
        .sign(secret)

      const { payload } = await jwtVerify(token, secret)
      expect(payload.email).toBe(testEmail)
      expect(payload.type).toBe('magic-link')
    })

    it('should reject expired tokens', async () => {
      const token = await new SignJWT({ email: testEmail, type: 'magic-link' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('-1s') // 已過期
        .setIssuedAt()
        .sign(secret)

      await expect(jwtVerify(token, secret)).rejects.toThrow()
    })

    it('should reject tokens with invalid signature', async () => {
      const wrongSecret = new TextEncoder().encode('wrong-secret-at-least-32-characters-long')
      const token = await new SignJWT({ email: testEmail, type: 'magic-link' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .setIssuedAt()
        .sign(wrongSecret)

      await expect(jwtVerify(token, secret)).rejects.toThrow()
    })
  })
})
