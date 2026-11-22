import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'

export const SPAWN = [-0.55, 0.85, 0.7]
const WALK = 2.6, RUN = 4.2, JUMP = 4.0, EYE = 0.72
const fwd = new THREE.Vector3(), side = new THREE.Vector3(), want = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0)

export default function Player({ cinematic, resetKey }) {
  const body = useRef()
  const vel = useRef(new THREE.Vector3())
  const bob = useRef(0)
  const [, keys] = useKeyboardControls()
  const { rapier, world } = useRapier()
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const b = body.current
    if (!b) return
    b.setTranslation({ x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] }, true)
    b.setLinvel({ x: 0, y: 0, z: 0 }, true)
    vel.current.set(0, 0, 0)
    camera.quaternion.setFromEuler(new THREE.Euler(-0.12, 0, 0, 'YXZ'))
  }, [resetKey, camera])

  useFrame((_, dt) => {
    const b = body.current
    if (!b) return
    dt = Math.min(dt, 0.05)
    const { forward, backward, left, right, jump, run } = keys()
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    side.crossVectors(fwd, UP)
    want.set(0, 0, 0)
    if (!cinematic) want.addScaledVector(fwd, +forward - +backward).addScaledVector(side, +right - +left)
    if (want.lengthSq() > 0) want.normalize().multiplyScalar(run ? RUN : WALK)
    vel.current.lerp(want, 1 - Math.exp(-10 * dt))

    const t = b.translation()
    const hit = world.castRay(new rapier.Ray(t, { x: 0, y: -1, z: 0 }), 0.86, true, undefined, undefined, undefined, b)
    const lv = b.linvel()
    b.setLinvel({ x: vel.current.x, y: jump && hit && !cinematic ? JUMP : lv.y, z: vel.current.z }, true)

    if (cinematic) return
    const speed = Math.hypot(vel.current.x, vel.current.z)
    if (hit) bob.current += dt * speed * 3.4
    camera.position.set(t.x, t.y + EYE + Math.sin(bob.current * 2) * 0.025 * Math.min(speed / WALK, 1), t.z)
  })

  return (
    <RigidBody ref={body} colliders={false} position={SPAWN} enabledRotations={[false, false, false]} friction={0} ccd canSleep={false}>
      <CapsuleCollider args={[0.5, 0.3]} />
    </RigidBody>
  )
}

// Slow dolly loop through the room for cinematic mode.
const path = new THREE.CatmullRomCurve3([
  [0.2, 1.55, 0.85], [-1.0, 1.35, -0.6], [-1.3, 1.6, -3.4], [-1.4, 1.5, -6.4], [-0.2, 1.9, -9.0],
  [1.2, 1.4, -10.0], [-0.9, 1.7, -12.0], [-1.5, 1.2, -9.6], [1.5, 1.4, -7.6], [1.4, 1.2, -4.8], [0.0, 1.0, -3.4], [1.2, 1.3, -0.4],
].map((p) => new THREE.Vector3(...p)), true, 'centripetal')
const look = new THREE.Vector3()

export function Cinematic() {
  const camera = useThree((s) => s.camera)
  const target = useRef(new THREE.Vector3(0, 1.2, -4))
  useFrame(({ clock }, dt) => {
    const u = (clock.elapsedTime / 90) % 1
    path.getPointAt(u, camera.position)
    path.getPointAt((u + 0.06) % 1, look)
    look.y -= 0.35
    target.current.lerp(look, 1 - Math.exp(-2 * dt))
    camera.lookAt(target.current)
  })
  return null
}
