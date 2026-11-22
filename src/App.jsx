import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, KeyboardControls, Lightformer, PointerLockControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import Room, { H, PZ } from './Room.jsx'
import Player, { Cinematic } from './Player.jsx'
import { TouchControls, isTouch } from './touch.jsx'
import { GuestPanel, RsvpForm, RsvpProvider, rsvpEnabled } from './Rsvp.jsx'
import { VenueTitle } from './EventInfo.jsx'

const KEYS = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

function Lights() {
  const gl = useThree((s) => s.gl)
  // The scene is static, so shadow maps render once instead of every frame.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    const ids = [100, 1000, 3000].map((ms) => setTimeout(() => { gl.shadowMap.needsUpdate = true }, ms))
    return () => ids.forEach(clearTimeout)
  }, [gl])
  const spot = (pos, target, shadow, extra = {}) => (
    <spotLight
      position={pos} target-position={target} angle={0.75} penumbra={0.9} intensity={14} distance={8} decay={2}
      color="#ffd9aa" castShadow={shadow} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.02} {...extra}
    />
  )
  return (
    <>
      <hemisphereLight args={['#5a4c40', '#1a1512', 0.8]} />
      {spot([0.6, H - 0.05, -1.2], [0.6, 0, -1.4], true)}
      {spot([0.1, 1.7, PZ], [0.1, 0, PZ], true, { angle: 1.0, intensity: 10, color: '#fff0d8' })}
      {spot([0.3, H - 0.05, -10.6], [0.3, 0, -11.0], false)}
      {/* reflections only: soft warm panels standing in for the downlights */}
      <Environment resolution={128} frames={1} environmentIntensity={0.35}>
        <color attach="background" args={['#120f0c']} />
        <Lightformer form="rect" intensity={2} color="#ffd8a8" position={[0, 3, -2]} rotation-x={Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#40ff80" position={[3, 2.5, 0]} rotation-y={-Math.PI / 2} scale={[6, 0.3, 1]} />
        <Lightformer form="rect" intensity={1} color="#d0e4ff" position={[0, 2, -12]} scale={[2, 1, 1]} />
      </Environment>
    </>
  )
}

export default function App() {
  const controls = useRef()
  const [locked, setLocked] = useState(false)
  const [started, setStarted] = useState(false)
  const [cinematic, setCinematic] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  // Phones have no pointer lock: once started, touch controls drive the camera.
  const playing = locked || (isTouch && started && !cinematic)

  const enter = () => {
    document.activeElement?.blur()
    setCinematic(false)
    setStarted(true)
    if (!isTouch) controls.current?.lock()
  }
  const fullscreen = () => {
    const d = document
    if (d.fullscreenElement) d.exitFullscreen?.()
    else d.documentElement.requestFullscreen?.().catch(() => {}) // iPhone Safari has no Fullscreen API
  }
  const reset = () => { setCinematic(false); setResetKey((k) => k + 1) }
  const toggleCinematic = () => setCinematic((c) => { if (!c) controls.current?.unlock(); return !c })
  const openRsvp = () => { controls.current?.unlock(); setGuestsOpen(false); setRsvpOpen(true) }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, select, textarea')) return
      if (e.code === 'KeyF') fullscreen()
      if (e.code === 'KeyR') reset()
      if (e.code === 'KeyC') toggleCinematic()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <RsvpProvider>
      <KeyboardControls map={KEYS}>
        <Canvas
          shadows
          flat
          dpr={isTouch ? 1 : [1, 1.25]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          camera={{ fov: isTouch ? 78 : 72, near: 0.05, far: 40, position: [-0.55, 1.6, 0.7] }}
        >
          <color attach="background" args={['#0b0b0c']} />
          <Suspense fallback={null}>
            <Physics timeStep="vary">
              <Room />
              <Player cinematic={cinematic} resetKey={resetKey} />
            </Physics>
            <Lights />
          </Suspense>
          {cinematic && <Cinematic />}
          {!isTouch && <PointerLockControls ref={controls} selector="#no-auto-lock" onLock={() => setLocked(true)} onUnlock={() => setLocked(false)} />}
          <EffectComposer multisampling={isTouch ? 0 : 2}>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={0.6} radius={0.7} />
            <Vignette offset={0.3} darkness={0.55} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>

        <VenueTitle />

        {playing && isTouch && !rsvpOpen && !guestsOpen && <TouchControls />}
        {playing && <div className="crosshair" />}
        {(!locked) && (
          <div className="bar">
            {rsvpEnabled && <button className="guests-toggle" onClick={() => setGuestsOpen((o) => !o)}>GUESTS</button>}
            {rsvpEnabled && <button className="primary" onClick={openRsvp}>RSVP</button>}
            {document.fullscreenEnabled && <button onClick={fullscreen}>FULLSCREEN</button>}
            <button onClick={reset}>RESET</button>
            <button onClick={toggleCinematic}>{cinematic ? 'EXIT CINEMATIC' : 'CINEMATIC'}</button>
          </div>
        )}
        <GuestPanel open={guestsOpen} onClose={() => setGuestsOpen(false)} onRsvp={openRsvp} />
        {!isTouch && <div className="hint">WASD move · Shift run · Space jump · Mouse look · F fullscreen · R reset · C cinematic · Esc release mouse</div>}
        {!playing && !cinematic && !rsvpOpen && (
          <div className="overlay" onClick={enter}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <h1>VENUE WALKTHROUGH</h1>
              {isTouch ? (
                <table><tbody>
                  <tr><td>LEFT THUMB</td><td>walk</td></tr>
                  <tr><td>RIGHT THUMB</td><td>look around</td></tr>
                  <tr><td>JUMP</td><td>jump</td></tr>
                </tbody></table>
              ) : (
                <table><tbody>
                  <tr><td>W A S D</td><td>walk</td></tr>
                  <tr><td>SHIFT</td><td>run</td></tr>
                  <tr><td>SPACE</td><td>jump</td></tr>
                  <tr><td>MOUSE</td><td>look around</td></tr>
                  <tr><td>C</td><td>cinematic camera</td></tr>
                  <tr><td>R</td><td>reset camera</td></tr>
                  <tr><td>F</td><td>fullscreen</td></tr>
                  <tr><td>ESC</td><td>release mouse</td></tr>
                </tbody></table>
              )}
              <div className="row">
                {rsvpEnabled && <button onClick={openRsvp}>RSVP TO THE PARTY</button>}
                <button className="primary" onClick={enter}>{started ? 'RESUME' : isTouch ? 'TAP TO ENTER' : 'CLICK TO ENTER'}</button>
              </div>
            </div>
          </div>
        )}
        {rsvpOpen && <RsvpForm onClose={() => setRsvpOpen(false)} />}
      </KeyboardControls>
    </RsvpProvider>
  )
}
