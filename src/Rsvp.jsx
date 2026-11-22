import { useCallback, useEffect, useMemo, useState } from 'react'
import { createRealtimeClient } from '@neon/realtime/client'
import { RealtimeProvider, useLiveQuery } from '@neon/realtime-react'
import { EventInfo, EVENT } from './EventInfo.jsx'

const API = import.meta.env.VITE_RSVP_URL
const RT = import.meta.env.VITE_REALTIME_URL
export const rsvpEnabled = Boolean(API && RT)
const client = rsvpEnabled ? createRealtimeClient({ url: RT }) : null

const fetchSealed = async () => {
  const r = await fetch(`${API}/live`, { method: 'POST' })
  if (!r.ok) throw new Error(`Guest list unavailable (${r.status})`)
  return r.json()
}

export function RsvpProvider({ children }) {
  return client ? <RealtimeProvider client={client}>{children}</RealtimeProvider> : children
}

// Guest list + stats. Live over Neon Realtime when this page's origin is allowed;
// otherwise (e.g. Vercel preview URLs) it falls back to polling the function.
export function GuestPanel({ open, onClose, onRsvp }) {
  const [sealed, setSealed] = useState(null)
  const [polling, setPolling] = useState(false)
  const fallBack = useCallback(() => setPolling(true), [])
  useEffect(() => { fetchSealed().then(setSealed, fallBack) }, [fallBack])
  if (!rsvpEnabled) return null
  return (
    <aside className={`guests${open ? ' open' : ''}`} aria-label="RSVP guest list">
      <div className="guests-head">
        <h2>PA CEBU YEAR END PARTY</h2>
        <button className="close" onClick={onClose} aria-label="Close guest list">×</button>
      </div>
      <EventInfo />
      <button className="primary wide" onClick={onRsvp}>RSVP NOW</button>
      {polling ? <PolledList /> : sealed ? <LiveList sealed={sealed} onFail={fallBack} /> : <p className="muted">Loading guest list…</p>}
    </aside>
  )
}

function LiveList({ sealed, onFail }) {
  const { data, status } = useLiveQuery(sealed, { refreshQuery: fetchSealed })
  useEffect(() => { if (status === 'error') onFail() }, [status, onFail])
  // A refused origin can leave the subscription waiting instead of erroring.
  useEffect(() => { if (data === undefined) { const id = setTimeout(onFail, 8000); return () => clearTimeout(id) } }, [data, onFail])
  if (data === undefined) return <p className="muted">Loading guest list…</p>
  return <Guests rows={data} live />
}

function PolledList() {
  const [rows, setRows] = useState()
  useEffect(() => {
    const load = () => fetch(`${API}/list`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setRows, () => {})
    load()
    const id = setInterval(load, 10000)
    window.addEventListener('rsvp:saved', load)
    return () => { clearInterval(id); window.removeEventListener('rsvp:saved', load) }
  }, [])
  if (rows === undefined) return <p className="muted">Loading guest list…</p>
  return <Guests rows={rows} />
}

function Guests({ rows, live }) {
  const stats = useMemo(() => {
    const depts = {}
    for (const r of rows) { const d = r.department || 'Other'; depts[d] = (depts[d] ?? 0) + 1 + r.guests }
    return {
      rsvps: rows.length,
      heads: rows.reduce((n, r) => n + 1 + r.guests, 0),
      depts: Object.entries(depts).sort((a, b) => b[1] - a[1]),
    }
  }, [rows])
  return (
    <>
      <div className="stats">
        <div><b>{stats.rsvps}</b><span>RSVPs</span></div>
        <div><b>{stats.heads}</b><span>Attending</span></div>
        <div><b>{stats.depts.length}</b><span>Teams</span></div>
      </div>
      {stats.depts.length > 0 && (
        <ul className="depts">
          {stats.depts.map(([d, n]) => (
            <li key={d}><span>{d}</span><i style={{ width: `${(n / stats.heads) * 100}%` }} /><b>{n}</b></li>
          ))}
        </ul>
      )}
      <h3>GUESTS {live && <span className="live">● LIVE</span>}</h3>
      {rows.length === 0 && <p className="muted">No RSVPs yet. Be the first!</p>}
      <ul className="names">
        {rows.map((r) => (
          <li key={r.id}>
            <span>{r.name}{r.guests > 0 && <em> +{r.guests}</em>}</span>
            <small>{r.department}</small>
          </li>
        ))}
      </ul>
    </>
  )
}

export function RsvpForm({ onClose }) {
  const [state, setState] = useState({ status: 'idle', message: '' })
  const submit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setState({ status: 'sending', message: '' })
    try {
      const r = await fetch(`${API}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: f.get('name'), email: f.get('email'), department: f.get('department'), guests: Number(f.get('guests')) }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(body.error || `Could not save your RSVP (${r.status})`)
      window.dispatchEvent(new Event('rsvp:saved'))
      setState({ status: 'done', message: body.created ? "You're on the list. See you at the party!" : 'Your RSVP was updated.' })
    } catch (err) {
      setState({ status: 'idle', message: err.message })
    }
  }
  return (
    <div className="overlay" onClick={onClose}>
      <form className="card rsvp" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h1>RSVP · PA CEBU YEAR END PARTY</h1>
        <p className="muted">{EVENT.date} · {EVENT.time}<br />{EVENT.venue}</p>
        {state.status === 'done' ? (
          <>
            <p>{state.message}</p>
            <button type="button" className="primary" onClick={onClose}>CLOSE</button>
          </>
        ) : (
          <>
            <label>Full name<input name="name" required maxLength={80} autoComplete="name" /></label>
            <label>Email<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
            <label>Team / department<input name="department" maxLength={80} /></label>
            <label>Bringing guests
              <select name="guests" defaultValue="0">
                {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n === 0 ? 'Just me' : `+${n}`}</option>)}
              </select>
            </label>
            {state.message && <p className="error" role="alert">{state.message}</p>}
            <p className="muted small">Your name and team appear on the public guest list. Your email is only used to update your RSVP.</p>
            <div className="row">
              <button type="button" onClick={onClose}>CANCEL</button>
              <button type="submit" className="primary" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'SENDING…' : 'CONFIRM RSVP'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
