// Creates the RSVP table. Run: node --env-file=.env.local scripts/migrate.mjs
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED.replace('sslmode=require', 'sslmode=verify-full') })
await client.connect()
await client.query(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    email text NOT NULL UNIQUE CHECK (length(email) BETWEEN 3 AND 200),
    department text NOT NULL DEFAULT '' CHECK (length(department) <= 80),
    guests int NOT NULL DEFAULT 0 CHECK (guests BETWEEN 0 AND 3),
    created_at timestamptz NOT NULL DEFAULT now()
  )`)
const { rows } = await client.query('SELECT count(*)::int AS n FROM rsvps')
console.log('rsvps table ready, rows:', rows[0].n)
await client.end()
