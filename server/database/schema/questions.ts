import { pgTable, uuid, serial, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { projects } from './projects'
import { viewers } from './viewers'

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  viewerId: uuid('viewer_id').references(() => viewers.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'visible', 'hidden'] }).notNull().default('pending'),
  isHiddenByStreamer: boolean('is_hidden_by_streamer').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_questions_project_status').on(table.projectId, table.status),
  index('idx_questions_created_at').on(table.createdAt),
])

export const questionsRelations = relations(questions, ({ one }) => ({
  project: one(projects, {
    fields: [questions.projectId],
    references: [projects.id],
  }),
  viewer: one(viewers, {
    fields: [questions.viewerId],
    references: [viewers.id],
  }),
}))

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type QuestionStatus = 'pending' | 'visible' | 'hidden'
