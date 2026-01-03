import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'

describe('Auth Validation', () => {
  const emailSchema = z.object({
    email: z.email('請輸入有效的電子郵件地址'),
  })

  describe('Email Validation', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse({ email: 'invalid-email' })
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const result = emailSchema.safeParse({ email: '' })
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const result = emailSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })
})

describe('Project Validation', () => {
  const projectSchema = z.object({
    name: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱不能超過 100 字'),
    description: z.string().max(500, '專案描述不能超過 500 字').optional(),
  })

  describe('Project Creation', () => {
    it('should accept valid project', () => {
      const result = projectSchema.safeParse({
        name: '測試專案',
        description: '這是一個測試專案',
      })
      expect(result.success).toBe(true)
    })

    it('should accept project without description', () => {
      const result = projectSchema.safeParse({
        name: '測試專案',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = projectSchema.safeParse({
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding 100 characters', () => {
      const result = projectSchema.safeParse({
        name: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('should reject description exceeding 500 characters', () => {
      const result = projectSchema.safeParse({
        name: '測試專案',
        description: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })
})
