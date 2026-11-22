// RSVP API for the PA Cebu Year End party.
//   POST /rsvp  { name, email, department?, guests? } -> { txid }
//   POST /live  -> sealed live query of the public guest list (no emails)
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Pool } from "pg"
import { attachDatabasePool } from "@neon/functions"
import { createRealtime, rawSql } from "@neon/realtime/server"

const dbUrl = process.env.DATABASE_URL!.replace("sslmode=require", "sslmode=verify-full")
const pool = new Pool({ connectionString: dbUrl, max: 5 })
attachDatabasePool(pool)

const realtime = createRealtime({
  // REALTIME_SECRET is uploaded by neon deploy; NEON_ names are reserved for Neon-injected vars.
  secret: (process.env.NEON_REALTIME_SECRET ?? process.env.REALTIME_SECRET)!,
  db: new URL(dbUrl).pathname.slice(1),
})

export type Rsvp = { id: string; name: string; department: string; guests: number; created_at: string }
const LIST_SQL = `SELECT id, name, department, guests, created_at FROM rsvps ORDER BY created_at DESC LIMIT 500`
const guestList = rawSql<Rsvp>(LIST_SQL)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

const app = new Hono()
// Public event page: no cookies or credentials are used, so any origin may call it.
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"], allowHeaders: ["Content-Type"] }))

app.post("/live", async (c) => c.json(await realtime.seal({ query: guestList })))
// Plain snapshot for pages whose origin Realtime does not allow (e.g. Vercel preview URLs).
app.get("/list", async (c) => c.json((await pool.query(LIST_SQL)).rows))

app.post("/rsvp", async (c) => {
  const body = await c.req.json().catch(() => null)
  const name = str(body?.name, 80)
  const email = str(body?.email, 200).toLowerCase()
  const department = str(body?.department, 80)
  const guests = Number.isInteger(body?.guests) ? Math.min(Math.max(body.guests, 0), 3) : 0
  if (!name) return c.json({ error: "Please enter your name." }, 400)
  if (!EMAIL.test(email)) return c.json({ error: "Please enter a valid email." }, 400)
  // Re-registering with the same email updates the entry instead of duplicating it.
  const { rows } = await pool.query(
    `INSERT INTO rsvps (name, email, department, guests) VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department, guests = EXCLUDED.guests
     RETURNING pg_current_xact_id()::text AS txid, (xmax = 0) AS created`,
    [name, email, department, guests],
  )
  return c.json({ txid: rows[0].txid, created: rows[0].created })
})

export default app
