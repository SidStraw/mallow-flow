import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'

export const viewers = pgTable('viewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Viewer = typeof viewers.$inferSelect
export type NewViewer = typeof viewers.$inferInsert
