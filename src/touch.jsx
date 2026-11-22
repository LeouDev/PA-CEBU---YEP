import { useRef, useState } from 'react'

export const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

// Shared with Player.jsx, which reads and drains it every frame.
export const touch = { x: 0, y: 0, jump: false, lookX: 0, lookY: 0 }
const R = 55 // joystick radius in px

// Left half of the screen: floating joystick. Right half: drag to look. Plus a jump button.
export function TouchControls() {
  const ids = useRef({ move: null, look: null, lx: 0, ly: 0, ox: 0, oy: 0 })
  const [stick, setStick] = useState(null)

  const start = (e) => {
    const s = ids.current
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth / 2 && s.move === null) {
        s.move = t.identifier; s.ox = t.clientX; s.oy = t.clientY
        setStick({ ox: t.clientX, oy: t.clientY, dx: 0, dy: 0 })
      } else if (s.look === null) {
        s.look = t.identifier; s.lx = t.clientX; s.ly = t.clientY
      }
    }
  }
  const move = (e) => {
    const s = ids.current
    for (const t of e.changedTouches) {
      if (t.identifier === s.move) {
        let dx = t.clientX - s.ox, dy = t.clientY - s.oy
        const len = Math.hypot(dx, dy)
        if (len > R) { dx *= R / len; dy *= R / len }
        touch.x = dx / R; touch.y = dy / R
        setStick({ ox: s.ox, oy: s.oy, dx, dy })
      } else if (t.identifier === s.look) {
        touch.lookX += t.clientX - s.lx; touch.lookY += t.clientY - s.ly
        s.lx = t.clientX; s.ly = t.clientY
      }
    }
  }
  const end = (e) => {
    const s = ids.current
    for (const t of e.changedTouches) {
      if (t.identifier === s.move) { s.move = null; touch.x = touch.y = 0; setStick(null) }
      if (t.identifier === s.look) s.look = null
    }
  }

  return (
    <>
      <div className="touch-layer" onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
        {stick && (
          <div className="stick" style={{ left: stick.ox, top: stick.oy }}>
            <div className="knob" style={{ transform: `translate(${stick.dx}px, ${stick.dy}px)` }} />
          </div>
        )}
        {!stick && <p className="touch-hint">Drag left side to walk · drag right side to look</p>}
      </div>
      <button
        className="jump" aria-label="Jump"
        onTouchStart={(e) => { e.stopPropagation(); touch.jump = true }}
        onTouchEnd={() => { touch.jump = false }}
      >JUMP</button>
    </>
  )
}
