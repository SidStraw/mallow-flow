import { describe, it, expect } from 'vitest'
import { streamers, projects } from '../../server/database/schema'

describe('Database Schema', () => {
  describe('Streamers Table', () => {
    it('should have correct column names', () => {
      expect(streamers.id.name).toBe('id')
      expect(streamers.email.name).toBe('email')
      expect(streamers.displayName.name).toBe('display_name')
      expect(streamers.avatarUrl.name).toBe('avatar_url')
      expect(streamers.createdAt.name).toBe('created_at')
      expect(streamers.updatedAt.name).toBe('updated_at')
    })
  })

  describe('Projects Table', () => {
    it('should have correct column names', () => {
      expect(projects.id.name).toBe('id')
      expect(projects.streamerId.name).toBe('streamer_id')
      expect(projects.name.name).toBe('name')
      expect(projects.description.name).toBe('description')
      expect(projects.isDefault.name).toBe('is_default')
      expect(projects.createdAt.name).toBe('created_at')
      expect(projects.updatedAt.name).toBe('updated_at')
    })
  })
})
