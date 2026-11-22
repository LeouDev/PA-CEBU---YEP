import { useEffect, useState } from 'react'

// Party details + a stylized night-city map of the venue.
export const EVENT = {
  date: 'SUN · DEC 6, 2026',
  time: '10:00 PM – 1:00 AM',
  venue: 'Chamber KTV',
  address: 'GF Terraces, Ayala Center Cebu, Cebu City 6000',
  maps: 'https://www.google.com/maps/search/?api=1&query=Chamber+KTV+Ayala+Center+Cebu',
  directions: 'https://www.google.com/maps/dir/?api=1&destination=Chamber+KTV+Ayala+Center+Cebu',
  // Philippine time (UTC+8), so every viewer counts down to the same moment.
  start: Date.parse('2026-12-06T22:00:00+08:00'),
  end: Date.parse('2026-12-07T01:00:00+08:00'),
}

// Pure so it can be checked without a clock: returns the phase and the d/h/m/s left.
export function countdown(now) {
  if (now >= EVENT.end) return { phase: 'over' }
  if (now >= EVENT.start) return { phase: 'live' }
  const s = Math.floor((EVENT.start - now) / 1000)
  return { phase: 'soon', d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 }
}

function Countdown() {
  const [now, setNow] = useState(Date.now)
  const c = countdown(now)
  useEffect(() => {
    if (c.phase === 'over') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [c.phase])
  if (c.phase === 'over') return <div className="countdown done">THANKS FOR PARTYING · SEE YOU NEXT YEAR</div>
  if (c.phase === 'live') return <div className="countdown live-now">● THE PARTY IS LIVE NOW</div>
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <div className="countdown" role="timer" aria-label={`${c.d} days ${c.h} hours ${c.m} minutes until the party`}>
      {[[c.d, 'DAYS'], [pad(c.h), 'HRS'], [pad(c.m), 'MIN'], [pad(c.s), 'SEC']].map(([v, u]) => (
        <span key={u}><b>{v}</b><small>{u}</small></span>
      ))}
    </div>
  )
}

export function EventInfo() {
  return (
    <section className="event">
      <dl>
        <dt>WHEN</dt><dd>{EVENT.date}<br /><b>{EVENT.time}</b></dd>
        <dt>WHERE</dt><dd>{EVENT.venue}<br /><small>{EVENT.address}</small></dd>
      </dl>
      <a className="map" href={EVENT.maps} target="_blank" rel="noreferrer" aria-label="Open the venue in Google Maps">
        <VenueMap />
      </a>
      <div className="map-links">
        <a href={EVENT.directions} target="_blank" rel="noreferrer">DIRECTIONS ↗</a>
        <span>Map not to scale</span>
      </div>
    </section>
  )
}

// Schematic of Cebu Business Park around Ayala Center, drawn as a dusk-lit street map.
function VenueMap() {
  const label = { fontFamily: 'Impact, "Arial Narrow", sans-serif', fontStyle: 'italic', letterSpacing: '.06em' }
  return (
    <svg viewBox="0 0 270 190" role="img" aria-label="Map: Chamber KTV, The Terraces, Ayala Center Cebu, Cebu Business Park">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#2a0f3d" />
          <stop offset="0.55" stopColor="#1a0f2e" />
          <stop offset="1" stopColor="#0d0b1c" />
        </linearGradient>
        <radialGradient id="glow" cx="0.82" cy="0.05" r="0.75">
          <stop offset="0" stopColor="#ff7a3c" stopOpacity=".55" />
          <stop offset="0.45" stopColor="#ff2f8e" stopOpacity=".22" />
          <stop offset="1" stopColor="#ff2f8e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="road" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4fa3" />
          <stop offset="1" stopColor="#ffb05a" />
        </linearGradient>
      </defs>
      <rect width="270" height="190" fill="url(#sky)" />
      <rect width="270" height="190" fill="url(#glow)" />
      {/* city blocks */}
      <g fill="#2b1d45" stroke="#3c2a5e" strokeWidth=".6">
        <rect x="10" y="12" width="62" height="40" rx="3" />
        <rect x="84" y="12" width="70" height="34" rx="3" />
        <rect x="200" y="14" width="58" height="44" rx="3" />
        <rect x="10" y="64" width="50" height="52" rx="3" />
        <rect x="10" y="128" width="72" height="50" rx="3" />
        <rect x="200" y="72" width="58" height="40" rx="3" />
        <rect x="186" y="126" width="72" height="52" rx="3" />
        <rect x="96" y="150" width="76" height="30" rx="3" />
      </g>
      {/* park */}
      <rect x="166" y="14" width="24" height="36" rx="3" fill="#123b33" stroke="#1d6b55" strokeWidth=".6" />
      {/* Ayala Center block */}
      <path d="M78 62 L176 58 L182 132 L86 138 Z" fill="#3a1f52" stroke="#ff4fa3" strokeWidth="1" strokeOpacity=".6" />
      <path d="M128 100 L172 98 L176 128 L132 131 Z" fill="#5a2a6e" />
      {/* roads */}
      <g fill="none" strokeLinecap="round">
        <path d="M0 56 L270 50" stroke="#120b20" strokeWidth="9" />
        <path d="M0 56 L270 50" stroke="url(#road)" strokeWidth="2.4" />
        <path d="M76 0 L84 190" stroke="#120b20" strokeWidth="8" />
        <path d="M76 0 L84 190" stroke="#5be3ff" strokeWidth="2" />
        <path d="M192 0 L186 120 L178 190" stroke="#120b20" strokeWidth="8" />
        <path d="M192 0 L186 120 L178 190" stroke="url(#road)" strokeWidth="2" />
        <path d="M0 122 L84 140 L270 118" stroke="#120b20" strokeWidth="7" />
        <path d="M0 122 L84 140 L270 118" stroke="#8a6cff" strokeWidth="1.6" />
      </g>
      {/* street names */}
      <g fill="#f2d7ff" fontSize="7" style={label}>
        <text x="96" y="47" transform="rotate(-1.2 96 47)">CARDINAL ROSALES AVE</text>
        <text x="70" y="22" transform="rotate(87 70 22)">ARCHBISHOP REYES AVE</text>
        <text x="196" y="132" fill="#ffd2a6">MINDANAO AVE</text>
        <text x="16" y="150" fill="#c9b8ff">SAMAR LOOP</text>
        <text x="167" y="34" fontSize="5.5" fill="#7fe0c0">PARK</text>
      </g>
      <text x="92" y="80" fill="#fff" fontSize="10" style={label}>AYALA CENTER CEBU</text>
      {/* venue pin */}
      <g transform="translate(152 116)">
        <circle className="pin-pulse" r="10" fill="#ff2f8e" />
        <path d="M0 0 C-7 -9 -7 -18 0 -20 C7 -18 7 -9 0 0 Z" fill="#ff2f8e" stroke="#fff" strokeWidth="1.2" />
        <circle cy="-13" r="3" fill="#fff" />
      </g>
      <g style={label}>
        <rect x="88" y="138" width="152" height="16" rx="2" fill="#ff2f8e" transform="skewX(-12)" />
        <text x="116" y="150" fill="#fff" fontSize="9">CHAMBER KTV · THE TERRACES</text>
      </g>
      <text x="262" y="184" fill="#ffffff66" fontSize="6" textAnchor="end" style={label}>CEBU BUSINESS PARK</text>
    </svg>
  )
}

// Big venue title pinned to the top-left of the screen.
export function VenueTitle() {
  return (
    <header className="venue-title" aria-label={`${EVENT.venue}, ${EVENT.address}`}>
      <span className="vt-kicker">PA CEBU LEADERSHIP · YEAR END PARTY</span>
      <h1>CHAMBER KTV</h1>
      <span className="vt-sub">THE TERRACES · AYALA CENTER CEBU · DEC 6 · 10PM–1AM</span>
      <Countdown />
    </header>
  )
}
