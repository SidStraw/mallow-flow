import { pgTable, uuid, varchar, timestamp, boolean, text, index } from 'drizzle-orm/pg-core'
import { streamers } from './streamers'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  streamerId: uuid('streamer_id').notNull().references(() => streamers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('projects_streamer_id_idx').on(table.streamerId),
])

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
