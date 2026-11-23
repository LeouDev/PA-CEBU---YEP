import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Instances, Instance, RoundedBox, useTexture } from '@react-three/drei'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { tex } from './textures.js'

// Room in metres: x -2.2 (wood wall) .. 2.2 (plaster wall), z 1.2 (door) .. -12.6 (back); z -4.4..-8.4 is the added pool zone, height 2.65.
export const W = 4.4, H = 2.65, Z0 = 1.2, Z1 = -12.6
const XL = -W / 2, XR = W / 2, D = Z0 - Z1, ZC = (Z0 + Z1) / 2

function useMaterials() {
  return useMemo(() => ({
    walnut: new THREE.MeshStandardMaterial({ map: tex('walnut', 1, 1), roughness: 0.55 }),
    walnutDark: new THREE.MeshStandardMaterial({ map: tex('walnut', 1, 1), color: '#7a6a60', roughness: 0.6 }),
    rosewood: new THREE.MeshPhysicalMaterial({ map: tex('rosewood', 1, 1, true), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    oak: new THREE.MeshPhysicalMaterial({ map: tex('oak', 1, 1, true), roughness: 0.35, clearcoat: 0.5 }),
    carpet: new THREE.MeshStandardMaterial({ map: tex('carpet', 3, 6.5), roughness: 1 }),
    fabric: new THREE.MeshStandardMaterial({ map: tex('fabric', 1, 1), roughness: 0.95 }),
    plaster: new THREE.MeshStandardMaterial({ color: '#cfc8bd', roughness: 0.92 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#2b2a2b', roughness: 0.9 }),
    shell: new THREE.MeshStandardMaterial({ color: '#1c1b1b', roughness: 0.9 }),
    leather: new THREE.MeshStandardMaterial({ color: "#b8874a", roughness: 0.42 }),
    leatherBrown: new THREE.MeshStandardMaterial({ color: "#5a2c1c", roughness: 0.45 }),
    blackLeather: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d0d0d0', metalness: 1, roughness: 0.18 }),
    black: new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.6 }),
    plastic: new THREE.MeshStandardMaterial({ color: '#e9e8e4', roughness: 0.5 }),
    screen: new THREE.MeshStandardMaterial({ color: '#050608', roughness: 0.08, metalness: 0.2, emissive: '#0b1420', emissiveIntensity: 0.6 }),
    projScreen: new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.85 }),
    silver: new THREE.MeshStandardMaterial({ color: '#9a9a9e', metalness: 0.7, roughness: 0.35 }),
    downlight: new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.2, 4), toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 2.6, 0.7), toneMapped: false }),
    neon: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 4, 5), toneMapped: false }),
    white: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.7 }),
  }), [])
}

// Box positioned by its min/max corners, which reads closer to a floor plan.
function B({ from, to, m, shadow = true }) {
  const s = [to[0] - from[0], to[1] - from[1], to[2] - from[2]].map(Math.abs)
  const p = [(to[0] + from[0]) / 2, (to[1] + from[1]) / 2, (to[2] + from[2]) / 2]
  return (
    <mesh position={p} material={m} castShadow={shadow} receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  )
}

function Shell({ M }) {
  const t = 0.2
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[W / 2 + t, t / 2, D / 2 + t]} position={[0, -t / 2, ZC]} />
      <CuboidCollider args={[W / 2 + t, t / 2, D / 2 + t]} position={[0, H + t / 2, ZC]} />
      <CuboidCollider args={[t / 2, H, D / 2 + t]} position={[XL - t / 2, H / 2, ZC]} />
      <CuboidCollider args={[t / 2, H, D / 2 + t]} position={[XR + t / 2, H / 2, ZC]} />
      <CuboidCollider args={[W / 2 + t, H, t / 2]} position={[0, H / 2, Z0 + t / 2]} />
      <CuboidCollider args={[W / 2 + t, H, t / 2]} position={[0, H / 2, Z1 - t / 2]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, ZC]} material={M.carpet} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, H, ZC]} material={M.ceiling} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <B from={[XL - t, 0, Z1 - t]} to={[XL, H, Z0 + t]} m={M.shell} shadow={false} />
      <B from={[XR, 0, Z1 - t]} to={[XR + t, H, Z0 + t]} m={M.shell} shadow={false} />
      <B from={[XL, 0, Z1 - t]} to={[XR, H, Z1]} m={M.shell} shadow={false} />
      {/* plaster wall behind the sofa */}
      <mesh position={[XR - 0.001, H / 2, (Z0 - 5) / 2]} rotation-y={-Math.PI / 2} material={M.plaster} receiveShadow>
        <planeGeometry args={[Z0 + 5, H]} />
      </mesh>
      {/* front wall + door */}
      <B from={[XL, 0, Z0 - 0.04]} to={[XR, H, Z0]} m={M.walnutDark} />
      <B from={[-1.75, 0, Z0 - 0.07]} to={[-0.85, 2.1, Z0 - 0.04]} m={M.walnut} />
      <B from={[-1.0, 1.0, Z0 - 0.11]} to={[-0.97, 1.05, Z0 - 0.07]} m={M.chrome} />
    </RigidBody>
  )
}

// Left wall: walnut panelling with the TV unit and curved console.
function WoodWall({ M }) {
  const x = XL + 0.05
  const g = 0.008
  const panels = [
    [1.95, H, Z0, -0.4], [1.95, H, -0.4, -2.9], [1.95, H, -2.9, -4.3],
    [0, 1.95, Z0, -0.9], [0, 1.95, -2.9, -4.3],
  ]
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        {panels.map(([y0, y1, z0, z1], i) => (
          <B key={i} from={[XL, y0 + g, z0 - g]} to={[x, y1 - g, z1 + g]} m={M.walnut} />
        ))}
        {/* TV cabinet */}
        <B from={[XL, 0, -0.9 - g]} to={[XL + 0.24, 1.95 - g, -2.9 + g]} m={M.walnut} />
        <B from={[XL + 0.24, 0.98, -0.98]} to={[XL + 0.29, 1.9, -2.82]} m={M.walnutDark} />
        <B from={[XL + 0.24, 0.0, -1.2]} to={[XL + 0.25, 0.9, -2.6]} m={M.walnutDark} />
      </RigidBody>
      <B from={[XL + 0.29, 1.08, -1.32]} to={[XL + 0.34, 1.78, -2.48]} m={M.black} />
      <mesh position={[XL + 0.345, 1.43, -1.9]} rotation-y={Math.PI / 2} material={M.screen}>
        <planeGeometry args={[1.1, 0.64]} />
      </mesh>
      <TvPicture position={[XL + 0.347, 1.43, -1.9]} />
      {/* curved console shelves */}
      {[0.32, 0.6].map((y) => (
        <mesh key={y} position={[XL + 0.24, y, -1.9]} scale={[1, 1, 2.1]} material={M.walnut} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.03, 40, 1, false, 0, Math.PI]} />
        </mesh>
      ))}
      <B from={[XL + 0.25, 0.62, -1.55]} to={[XL + 0.5, 0.7, -1.95]} m={M.silver} />
      <B from={[XL + 0.25, 0.62, -2.05]} to={[XL + 0.42, 0.72, -2.25]} m={M.black} />
      <B from={[XL + 0.25, 0.34, -1.6]} to={[XL + 0.52, 0.42, -2.2]} m={M.black} />
      <B from={[XL + 0.25, 0.34, -2.3]} to={[XL + 0.45, 0.4, -2.5]} m={M.silver} />
      {/* no-smoking plate, switches */}
      <B from={[XL + 0.24, 1.97, -1.7]} to={[XL + 0.26, 2.1, -2.1]} m={M.black} />
      {[[1.25, -0.15], [1.25, -0.35], [1.05, -0.35], [1.05, -0.15]].map(([y, z], i) => (
        <B key={i} from={[x, y, z]} to={[x + 0.01, y + 0.1, z - 0.1]} m={i ? M.black : M.plastic} shadow={false} />
      ))}
    </group>
  )
}

// Fabric acoustic tiles on the far half of the room.
function AcousticPanels({ M }) {
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 0.06, 3, 0.025), [])
  const tiles = useMemo(() => {
    const out = []
    const rows = 3, h = H / rows
    const run = (len, cols, place) => {
      const w = len / cols
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out.push(place(c * w + w / 2, r * h + h / 2, w, h))
    }
    run(-4.3 - Z1, 12, (a, y, w, h) => ({ p: [XL + 0.03, y, -4.3 - a], r: Math.PI / 2, s: [w - 0.02, h - 0.02, 1] }))
    run(W, 6, (a, y, w, h) => ({ p: [XL + a, y, Z1 + 0.03], r: 0, s: [w - 0.02, h - 0.02, 1] }))
    run(-5 - Z1, 11, (a, y, w, h) => ({ p: [XR - 0.03, y, -5 - a], r: -Math.PI / 2, s: [w - 0.02, h - 0.02, 1] }))
    return out
  }, [])
  return (
    <Instances limit={tiles.length} material={M.fabric} castShadow receiveShadow>
      <primitive object={geo} attach="geometry" />
      {tiles.map((t, i) => <Instance key={i} position={t.p} rotation-y={t.r} scale={t.s} />)}
    </Instances>
  )
}

// Curved tan leather banquette following the plaster wall, bending toward the door.
function Sofa({ M }) {
  const segs = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.86, 0, -4.9), new THREE.Vector3(1.86, 0, -2.6), new THREE.Vector3(1.8, 0, -0.9),
      new THREE.Vector3(1.5, 0, 0.25), new THREE.Vector3(0.95, 0, 0.78),
    ])
    const n = 36
    const pts = curve.getSpacedPoints(n)
    return pts.slice(0, n).map((a, i) => {
      const b = pts[i + 1]
      const d = b.clone().sub(a)
      const len = d.length()
      // local +x of each segment points at the wall, so the backrest sits at +x
      return { mid: a.clone().add(b).multiplyScalar(0.5), len, rot: Math.atan2(d.x, d.z) }
    })
  }, [])
  return (
    <RigidBody type="fixed" colliders="cuboid">
      {segs.map(({ mid, len, rot }, i) => (
        <group key={i} position={[mid.x, 0, mid.z]} rotation-y={rot}>
          <mesh position={[0, 0.11, 0]} material={M.leatherBrown} castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.22, len + 0.01]} />
          </mesh>
          <RoundedBox args={[0.66, 0.22, len * 1.2]} radius={0.035} smoothness={3} position={[-0.02, 0.33, 0]} material={M.leather} castShadow receiveShadow />
          <RoundedBox args={[0.2, 0.62, len * 1.25]} radius={0.04} smoothness={3} position={[0.27, 0.68, 0]} rotation-z={-0.08} material={M.leather} castShadow receiveShadow />
        </group>
      ))}
    </RigidBody>
  )
}

function CoffeeArea({ M }) {
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0.8, 0.42, -1.3]} material={M.rosewood} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.05, 2.6]} />
        </mesh>
        <B from={[0.5, 0, -0.2]} to={[1.1, 0.395, -2.4]} m={M.walnutDark} />
        <RoundedBox args={[0.46, 0.44, 0.46]} radius={0.04} position={[0.12, 0.22, 0.62]} material={M.leatherBrown} castShadow receiveShadow />
        <RoundedBox args={[0.46, 0.44, 0.46]} radius={0.04} position={[0.05, 0.22, -2.85]} material={M.leatherBrown} castShadow receiveShadow />
      </RigidBody>
      <B from={[0.78, 0.445, -1.2]} to={[0.92, 0.53, -1.36]} m={M.black} />
      <mesh position={[0.85, 0.56, -1.28]} rotation-z={0.3} material={M.white}>
        <boxGeometry args={[0.02, 0.07, 0.06]} />
      </mesh>
    </group>
  )
}

function ProjectorScreen({ M }) {
  const leg = (x, a) => (
    <mesh key={`${x}${a}`} position={[x + Math.sin(a) * 0.14, 0.11, Math.cos(a) * 0.14]} rotation={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]} material={M.black} castShadow>
      <cylinderGeometry args={[0.012, 0.012, 0.36]} />
    </mesh>
  )
  return (
    <group position={[-0.75, 0, -8.7]} rotation-y={-0.22}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.6, 1.0, 0.18]} position={[0, 1.0, 0]} />
      </RigidBody>
      <mesh position={[0, 1.5, 0]} material={M.projScreen} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.12, 0.01]} />
      </mesh>
      <B from={[-0.55, 0.92, -0.03]} to={[0.55, 2.08, -0.012]} m={M.black} />
      {[-0.55, 0.55].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.03, 0]} material={M.black} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 2.06]} />
          </mesh>
          {[0, 2.1, 4.2].map((a) => leg(x, a))}
        </group>
      ))}
    </group>
  )
}

function Chair({ M, position, rot }) {
  return (
    <group position={position} rotation-y={rot}>
      <RoundedBox args={[0.46, 0.06, 0.44]} radius={0.02} position={[0, 0.47, 0]} material={M.blackLeather} castShadow />
      <RoundedBox args={[0.46, 0.36, 0.05]} radius={0.02} position={[0, 0.77, -0.22]} rotation-x={-0.12} material={M.blackLeather} castShadow />
      {[[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.22, z]} material={M.chrome} castShadow>
          <cylinderGeometry args={[0.011, 0.011, 0.45]} />
        </mesh>
      ))}
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.62, -0.2]} material={M.chrome}>
          <cylinderGeometry args={[0.01, 0.01, 0.3]} />
        </mesh>
      ))}
    </group>
  )
}

function MeetingArea({ M }) {
  const cx = 0.3, cz = -11.0
  const chairs = [
    ...[-0.62, 0, 0.62].map((dz) => [[cx - 0.72, 0, cz + dz], Math.PI / 2]),
    ...[-0.62, 0, 0.62].map((dz) => [[cx + 0.72, 0, cz + dz], -Math.PI / 2]),
    [[cx, 0, cz - 1.3], 0], [[cx, 0, cz + 1.3], Math.PI],
  ]
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[cx, 0.74, cz]} material={M.oak} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.045, 2.2]} />
        </mesh>
        <B from={[cx - 0.07, 0.05, cz - 0.7]} to={[cx + 0.07, 0.72, cz + 0.7]} m={M.black} />
        <B from={[cx - 0.35, 0, cz - 0.75]} to={[cx + 0.35, 0.05, cz + 0.75]} m={M.black} />
        {chairs.map(([p, r], i) => (
          <CuboidCollider key={i} args={[0.24, 0.5, 0.24]} position={[p[0], 0.5, p[2]]} />
        ))}
      </RigidBody>
      {chairs.map(([p, r], i) => <Chair key={i} M={M} position={p} rot={r} />)}
      {/* flowers */}
      <mesh position={[cx, 0.82, cz + 0.1]} material={M.black}>
        <cylinderGeometry args={[0.06, 0.05, 0.13]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[cx + Math.cos(i * 2.4) * 0.07, 0.93 + (i % 3) * 0.025, cz + 0.1 + Math.sin(i * 2.4) * 0.07]} material={M.white} castShadow>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
      ))}
      {/* subwoofer next to the screen */}
      <RigidBody type="fixed" colliders="cuboid">
        <B from={[-1.5, 0, -8.85]} to={[-1.05, 0.48, -9.3]} m={M.black} />
      </RigidBody>
    </group>
  )
}

function Neon({ M }) {
  const geo = useMemo(() => {
    const pts = [[-0.45, -0.05], [-0.32, 0.14], [-0.18, -0.12], [-0.03, 0.17], [0.12, -0.1], [0.27, 0.19], [0.36, 0.0], [0.46, 0.12]]
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)))
    return new THREE.TubeGeometry(curve, 120, 0.013, 8)
  }, [])
  return (
    <group position={[0.4, 1.9, -11.3]} scale={1.6}>
      <mesh geometry={geo} material={M.neon} />
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} material={M.black}>
          <cylinderGeometry args={[0.002, 0.002, 0.6]} />
        </mesh>
      ))}
      <pointLight color="#cfe4ff" intensity={2.2} distance={4} decay={2} position={[0, -0.1, 0.2]} />
    </group>
  )
}

// Regulation 8 ft table (2.54 x 1.27 m play area) with a hanging billiard lamp.
const BALLS = ['#f2c200', '#1d3f9e', '#c8201c', '#4b1d7a', '#e86a10', '#106030', '#7a1a12', '#111111']
export const PZ = -6.4
function PoolArea({ M }) {
  const felt = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1d5e3a', roughness: 1 }), [])
  const shade = useMemo(() => new THREE.MeshStandardMaterial({ color: "#123d26", roughness: 0.5, side: THREE.DoubleSide }), [])
  const balls = useMemo(() => {
    const r = 0.0286, out = []
    let k = 0
    for (let row = 0; row < 5; row++) for (let j = 0; j <= row; j++) {
      const n = k++
      out.push({ p: [(j - row / 2) * 2.02 * r, 0.795 + r, PZ - 0.6 - row * 1.75 * r], color: BALLS[n % 8], stripe: n >= 8 })
    }
    out.push({ p: [0.05, 0.795 + r, PZ + 0.64], color: '#f5f2e8' })
    return out
  }, [])
  const ballMats = useMemo(() => Object.fromEntries([...BALLS, '#f5f2e8'].map((c) => [c, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 1 })])), [])
  const rail = 0.115, ow = 1.27 / 2 + rail, ol = 2.54 / 2 + rail
  return (
    <group position={[0.1, 0, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[ow, 0.42, ol]} position={[0, 0.42, PZ]} />
      </RigidBody>
      <B from={[-ow, 0.6, PZ - ol]} to={[ow, 0.78, PZ + ol]} m={M.walnut} />
      <B from={[-0.635, 0.78, PZ - 1.27]} to={[0.635, 0.795, PZ + 1.27]} m={felt} />
      {/* felt cushions + wooden top rails */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <B from={[s * 0.635, 0.78, PZ - 1.27]} to={[s * 0.595, 0.835, PZ + 1.27]} m={felt} />
          <B from={[s * ow, 0.78, PZ - ol]} to={[s * 0.635, 0.845, PZ + ol]} m={M.rosewood} />
          <B from={[-0.635, 0.78, PZ + s * ol]} to={[0.635, 0.845, PZ + s * 1.27]} m={M.rosewood} />
          <B from={[-0.635, 0.78, PZ + s * 1.27]} to={[0.635, 0.835, PZ + s * 1.23]} m={felt} />
        </group>
      ))}
      {[[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * 0.62, 0.848, PZ + sz * 1.255]} material={M.black}>
          <cylinderGeometry args={[0.058, 0.058, 0.01, 20]} />
        </mesh>
      ))}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <B key={`${sx}${sz}`} from={[sx * 0.55, 0, PZ + sz * 1.15]} to={[sx * 0.7, 0.6, PZ + sz * 1.3]} m={M.walnutDark} />
      ))}
      <B from={[-0.5, 0.06, PZ - 1.1]} to={[0.5, 0.12, PZ + 1.1]} m={M.walnutDark} />
      {balls.map((b, i) => (
        <group key={i} position={b.p}>
          <mesh material={ballMats[b.color]} castShadow>
            <sphereGeometry args={[0.0286, 20, 14]} />
          </mesh>
          {b.stripe && (
            <mesh material={M.white} scale={[1.01, 0.5, 1.01]}>
              <sphereGeometry args={[0.0286, 20, 8]} />
            </mesh>
          )}
        </group>
      ))}
      {/* cue resting on the felt */}
      <mesh position={[0.4, 0.81, PZ + 0.2]} rotation={[Math.PI / 2, 0, 0.18]} material={M.oak} castShadow>
        <cylinderGeometry args={[0.006, 0.014, 1.45, 10]} />
      </mesh>
      {/* billiard lamp: three shades on a bar */}
      <B from={[-0.04, 1.86, PZ - 0.85]} to={[0.04, 1.9, PZ + 0.85]} m={M.black} />
      {[-0.6, 0, 0.6].map((dz) => (
        <group key={dz} position={[0, 1.78, PZ + dz]}>
          <mesh material={shade}>
            <cylinderGeometry args={[0.07, 0.2, 0.16, 24, 1, true]} />
          </mesh>
          <mesh position={[0, -0.04, 0]} rotation-x={Math.PI / 2} material={M.downlight}>
            <circleGeometry args={[0.07, 20]} />
          </mesh>
        </group>
      ))}
      {[-0.8, 0.8].map((dz) => (
        <mesh key={dz} position={[0, 2.27, PZ + dz]} material={M.black}>
          <cylinderGeometry args={[0.004, 0.004, 0.75]} />
        </mesh>
      ))}
    </group>
  )
}

const DOWNLIGHTS =[[-0.9, -0.6], [0.9, -1.4], [-0.6, -3.6], [1.0, -3.9], [-1.3, -5.3], [1.4, -7.5], [-0.7, -10.0], [1.1, -10.2], [-0.5, -11.9], [1.1, -12.0]]

function Ceiling({ M }) {
  return (
    <group>
      {/* soffit over the plaster wall with the green cove LED */}
      <B from={[1.55, H - 0.18, Z0]} to={[XR, H, -5.0]} m={M.ceiling} shadow={false} />
      <B from={[1.53, H - 0.185, Z0]} to={[1.56, H - 0.17, -5.0]} m={M.green} shadow={false} />
      <B from={[XL, H - 0.012, -4.55]} to={[1.55, H - 0.005, -4.6]} m={M.green} shadow={false} />
      {[-1.6].map((z) => (
        <pointLight key={z} color="#29ff6a" intensity={2} distance={4} decay={2} position={[1.4, H - 0.25, z]} />
      ))}
      {/* AC cassette */}
      <B from={[-0.08, H - 0.05, -8.98]} to={[0.72, H, -9.78]} m={M.plastic} />
      {[0, 1, 2, 3].map((i) => {
        const horiz = i < 2
        const off = i % 2 ? 0.3 : -0.3
        return horiz
          ? <B key={i} from={[0.07, H - 0.052, -9.38 + off - 0.03]} to={[0.57, H - 0.05, -9.38 + off + 0.03]} m={M.shell} shadow={false} />
          : <B key={i} from={[0.32 + off - 0.03, H - 0.052, -9.13]} to={[0.32 + off + 0.03, H - 0.05, -9.63]} m={M.shell} shadow={false} />
      })}
      {/* smoke detector, wall speaker */}
      <mesh position={[0.6, H - 0.02, -2.2]} material={M.plastic}>
        <cylinderGeometry args={[0.06, 0.07, 0.04, 20]} />
      </mesh>
      <B from={[1.75, 2.18, 0.9]} to={[2.15, 2.42, 0.5]} m={M.black} />
      {DOWNLIGHTS.map(([x, z], i) => (
        <group key={`${x}${z}`} position={[x, H - 0.003, z]}>
          <mesh rotation-x={Math.PI / 2} material={M.downlight}>
            <circleGeometry args={[0.045, 20]} />
          </mesh>
          {/* every other fixture gets a real light: per-pixel cost scales with light count */}
          {i % 2 === 0 && <pointLight color="#ffd6a3" intensity={6} distance={6} decay={2} position={[0, -0.15, 0]} />}
        </group>
      ))}
    </group>
  )
}

export default function Room() {
  const M = useMaterials()
  return (
    <group>
      <Shell M={M} />
      <WoodWall M={M} />
      <AcousticPanels M={M} />
      <Sofa M={M} />
      <CoffeeArea M={M} />
      <PoolArea M={M} />
      <ProjectorScreen M={M} />
      <MeetingArea M={M} />
      <Neon M={M} />
      <Ceiling M={M} />
    </group>
  )
}

// Team photo on the TV, fitted to the screen height (black bars at the sides) so nobody is cropped.
function TvPicture({ position }) {
  const map = useTexture('./tv.webp')
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  const h = 0.64, w = Math.min(1.1, (h * map.image.width) / map.image.height)
  return (
    <mesh position={position} rotation-y={Math.PI / 2}>
      <planeGeometry args={[w, h]} />
      {/* unlit so it reads as a lit screen; kept at 1.0 so white areas do not bloom */}
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  )
}
