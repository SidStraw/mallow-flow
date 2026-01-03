import { describe, it, expect } from 'vitest'
import { questions, viewers, questionsRelations } from '../../server/database/schema'

describe('Questions Schema', () => {
  describe('Questions Table', () => {
    it('should have correct column names', () => {
      expect(questions.id.name).toBe('id')
      expect(questions.projectId.name).toBe('project_id')
      expect(questions.viewerId.name).toBe('viewer_id')
      expect(questions.displayName.name).toBe('display_name')
      expect(questions.content.name).toBe('content')
      expect(questions.status.name).toBe('status')
      expect(questions.isHiddenByStreamer.name).toBe('is_hidden_by_streamer')
      expect(questions.createdAt.name).toBe('created_at')
      expect(questions.updatedAt.name).toBe('updated_at')
    })
  })

  describe('Viewers Table', () => {
    it('should have correct column names', () => {
      expect(viewers.id.name).toBe('id')
      expect(viewers.createdAt.name).toBe('created_at')
    })
  })
})
