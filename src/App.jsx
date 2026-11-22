import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, KeyboardControls, Lightformer, PointerLockControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import Room, { H } from './Room.jsx'
import Player, { Cinematic } from './Player.jsx'

const KEYS = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

function Lights() {
  const spot = (pos, target) => (
    <spotLight
      position={pos} target-position={target} angle={0.75} penumbra={0.9} intensity={14} distance={8} decay={2}
      color="#ffd9aa" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.02}
    />
  )
  return (
    <>
      <hemisphereLight args={['#5a4c40', '#1a1512', 0.6]} />
      {spot([0.6, H - 0.05, -1.2], [0.6, 0, -1.4])}
      {spot([0.3, H - 0.05, -6.6], [0.3, 0, -7.0])}
      {spot([-1.2, H - 0.05, -2.8], [-2.2, 0.8, -2.2])}
      {/* reflections only: soft warm panels standing in for the downlights */}
      <Environment resolution={128} frames={1} environmentIntensity={0.35}>
        <color attach="background" args={['#120f0c']} />
        <Lightformer form="rect" intensity={2} color="#ffd8a8" position={[0, 3, -2]} rotation-x={Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#40ff80" position={[3, 2.5, 0]} rotation-y={-Math.PI / 2} scale={[6, 0.3, 1]} />
        <Lightformer form="rect" intensity={1} color="#d0e4ff" position={[0, 2, -8]} scale={[2, 1, 1]} />
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

  const enter = () => { document.activeElement?.blur(); setCinematic(false); setStarted(true); controls.current?.lock() }
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())
  const reset = () => { setCinematic(false); setResetKey((k) => k + 1) }
  const toggleCinematic = () => setCinematic((c) => { if (!c) controls.current?.unlock(); return !c })

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyF') fullscreen()
      if (e.code === 'KeyR') reset()
      if (e.code === 'KeyC') toggleCinematic()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <KeyboardControls map={KEYS}>
      <Canvas
        shadows
        flat
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 72, near: 0.05, far: 40, position: [-0.55, 1.6, 0.7] }}
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
        <PointerLockControls ref={controls} selector="#no-auto-lock" onLock={() => setLocked(true)} onUnlock={() => setLocked(false)} />
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} halfRes />
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.6} radius={0.7} />
          <Vignette offset={0.3} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>

      {locked && <div className="crosshair" />}
      {!locked && (
        <div className="bar">
          <button onClick={fullscreen}>FULLSCREEN</button>
          <button onClick={reset}>RESET CAMERA</button>
          <button onClick={toggleCinematic}>{cinematic ? 'EXIT CINEMATIC' : 'CINEMATIC'}</button>
        </div>
      )}
      <div className="hint">WASD move · Shift run · Space jump · Mouse look · F fullscreen · R reset · C cinematic · Esc release mouse</div>
      {!locked && !cinematic && (
        <div className="overlay" onClick={enter}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h1>LOUNGE WALKTHROUGH</h1>
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
            <button className="primary" onClick={enter}>{started ? 'RESUME' : 'CLICK TO ENTER'}</button>
          </div>
        </div>
      )}
    </KeyboardControls>
  )
}
