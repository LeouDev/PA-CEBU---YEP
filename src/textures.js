import * as THREE from 'three'

// Procedural canvas textures, so the app ships with no image assets.
function make(size, draw) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  draw(img.data, size)
  ctx.putImageData(img, 0, 0)
  return c
}

const TAU = Math.PI * 2
const rand = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647) })()

// Vertical-grain veneer: k integer frequencies keep it seamless.
function wood(base, contrast, lines) {
  return make(512, (d, n) => {
    const col = new Float32Array(n)
    for (let x = 0; x < n; x++) {
      const u = x / n
      col[x] = 0.55 * Math.sin(TAU * (lines * u + 0.4 * Math.sin(TAU * 3 * u))) + 0.3 * Math.sin(TAU * lines * 3.0 * u) + (rand() - 0.5) * 0.9
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const xs = (x + Math.round(2 * Math.sin(TAU * (2 * y / n + x / n)))) & (n - 1)
      const v = 1 + contrast * col[xs] + (rand() - 0.5) * 0.05
      const i = (y * n + x) * 4
      d[i] = base[0] * v; d[i + 1] = base[1] * v; d[i + 2] = base[2] * v; d[i + 3] = 255
    }
  })
}

// Op-art warped checker like the photos' carpet: charcoal / tan / mid tones.
function carpet() {
  const dark = [48, 45, 40], mid = [92, 82, 66], tan = [138, 116, 84]
  return make(1024, (d, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n
      const a = Math.sin(TAU * (12 * u + 0.6 * Math.sin(TAU * 2 * v)))
      const b = Math.sin(TAU * (12 * v + 0.6 * Math.sin(TAU * 2 * u)))
      const p = a * b
      const big = Math.sin(TAU * 3 * u) * Math.sin(TAU * 3 * v)
      const c = p > 0.15 ? (big > 0 ? tan : mid) : p < -0.15 ? dark : mid
      const f = 0.85 + rand() * 0.3
      const i = (y * n + x) * 4
      d[i] = c[0] * f; d[i + 1] = c[1] * f; d[i + 2] = c[2] * f; d[i + 3] = 255
    }
  })
}

function fabric() {
  return make(256, (d, n) => {
    for (let i = 0; i < n * n; i++) {
      const f = 0.9 + rand() * 0.2
      d[i * 4] = 66 * f; d[i * 4 + 1] = 62 * f; d[i * 4 + 2] = 62 * f; d[i * 4 + 3] = 255
    }
  })
}

const canvases = {}
const sources = {
  walnut: () => wood([92, 62, 42], 0.22, 40),
  rosewood: () => wood([112, 62, 38], 0.22, 70),
  oak: () => wood([140, 92, 58], 0.18, 50),
  carpet,
  fabric,
}

export function tex(name, rx = 1, ry = 1, rotate = false) {
  canvases[name] ??= sources[name]()
  const t = new THREE.CanvasTexture(canvases[name])
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  if (rotate) { t.rotation = Math.PI / 2; t.center.set(0.5, 0.5) }
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
