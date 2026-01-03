import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '../../server/utils/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset the rate limit store by directly accessing and clearing
    vi.useFakeTimers()
  })

  it('should allow first request', () => {
    const result = checkRateLimit('test-ip-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should decrement remaining count on subsequent requests', () => {
    const ip = 'test-ip-2'
    const result1 = checkRateLimit(ip)
    expect(result1.remaining).toBe(4)

    const result2 = checkRateLimit(ip)
    expect(result2.remaining).toBe(3)

    const result3 = checkRateLimit(ip)
    expect(result3.remaining).toBe(2)
  })

  it('should block after 5 requests in the same window', () => {
    const ip = 'test-ip-3'
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(ip)
      expect(result.allowed).toBe(true)
    }

    const blockedResult = checkRateLimit(ip)
    expect(blockedResult.allowed).toBe(false)
    expect(blockedResult.remaining).toBe(0)
  })

  it('should allow requests from different IPs independently', () => {
    const ip1 = 'test-ip-4'
    const ip2 = 'test-ip-5'

    // Exhaust rate limit for ip1
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip1)
    }

    // ip2 should still be allowed
    const result = checkRateLimit(ip2)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should reset after window expires', () => {
    const ip = 'test-ip-6'

    // Exhaust rate limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip)
    }

    const blockedResult = checkRateLimit(ip)
    expect(blockedResult.allowed).toBe(false)

    // Advance time past the window (1 minute + 1ms)
    vi.advanceTimersByTime(60 * 1000 + 1)

    const allowedResult = checkRateLimit(ip)
    expect(allowedResult.allowed).toBe(true)
    expect(allowedResult.remaining).toBe(4)
  })
})
