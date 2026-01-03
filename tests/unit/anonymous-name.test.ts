import { describe, it, expect } from 'vitest'
import { generateAnonymousName } from '../../server/utils/anonymous-name'

describe('Anonymous Name Generator', () => {
  it('should generate a name with adjective and animal', () => {
    const name = generateAnonymousName()
    expect(name).toBeTruthy()
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(2)
  })

  it('should generate different names on multiple calls', () => {
    const names = new Set<string>()
    for (let i = 0; i < 50; i++) {
      names.add(generateAnonymousName())
    }
    // With 15 adjectives and 15 animals, we have 225 combinations
    // 50 calls should produce some variety
    expect(names.size).toBeGreaterThan(5)
  })
})
