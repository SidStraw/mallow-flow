import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

let _db: ReturnType<typeof createDb> | null = null

function createDb() {
  const config = useRuntimeConfig()
  const connectionString = config.databaseUrl

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
  }

  const client = postgres(connectionString, {
    prepare: false, // Cloudflare Workers 不支援 prepared statements
  })

  return drizzle(client, { schema })
}

export function useDb() {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

export type Database = ReturnType<typeof useDb>
