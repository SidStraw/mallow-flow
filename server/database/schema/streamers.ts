import { pgTable, uuid, varchar, timestamp, boolean, text, index } from 'drizzle-orm/pg-core'

export const streamers = pgTable('streamers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('streamers_email_idx').on(table.email),
])

export type Streamer = typeof streamers.$inferSelect
export type NewStreamer = typeof streamers.$inferInsert
