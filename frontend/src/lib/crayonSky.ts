/**
 * Crayon sky: a revolving solar system drawn on a 2D canvas to look coloured in with wax crayons.
 *
 * - Drag sideways to spin the system, tap a planet to select it.
 * - With `focus` set, selecting a body flies the camera to it and follows it while it orbits.
 * - `setZoom` lets the page zoom in (the home page ties it to scrolling).
 * Sizes and distances are squashed so everything fits (see data/planets.ts).
 */
import { BODIES, MOON_BODY, type Body } from '../data/planets'

const ALL: Body[] = [...BODIES, MOON_BODY]
const MAX_ORBIT = Math.max(...BODIES.map((b) => b.orbit))

/**
 * Worlds with painted, gently moving art (public/planets: a looping video and a transparent still each).
 * They are drawn instead of the crayon colouring; the Sun keeps its crayon rays around the painting.
 */
const PAINTED = new Set(['sun', 'earth', 'mars', 'moon'])
const paintedUrl = (id: string, ext: 'mp4' | 'webp') => `${import.meta.env.BASE_URL}planets/${id}.${ext}`
/** How much of the painted picture's width the round world fills. */
const DISC = 0.975

export interface SkyPos {
  x: number
  y: number
  /** Drawn radius of the body itself. */
  r: number
  /** Radius including rings or sun rays. */
  ext: number
}
export type SkyPositions = Record<string, SkyPos>

export interface SkyOptions {
  /** Where the Sun sits, as fractions of the canvas size. */
  center?: [number, number]
  /** How much of the canvas width the widest orbit fills. */
  fill?: number
  /** How flat the orbits look (1 = seen from straight above). */
  tilt?: number
  /** The largest value `setZoom` accepts. Sprites are drawn at this size so zooming stays sharp. */
  maxZoom?: number
  /** Where a selected body should sit and how big, in canvas pixels. Leave out to turn the follow camera off. */
  focus?: (body: Body, w: number, h: number) => { x: number; y: number; r: number }
  onSelect?: (body: Body | null) => void
  onFrame?: (positions: SkyPositions) => void
}

export interface SkyHandle {
  select: (id: string | null) => void
  setZoom: (z: number) => void
  destroy: () => void
}

interface Sprite {
  canvas: HTMLCanvasElement
  cx: number
  cy: number
  /** Radius the drawing was made at, in device pixels. */
  r: number
}

/** Deterministic random, so the drawing looks the same on every visit. */
function rng(seed: number | string) {
  let s = typeof seed === 'string' ? seed.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 7) : seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w))
  c.height = Math.max(1, Math.ceil(h))
  return c
}

/** A hand-drawn circle: wobbly points joined by smooth curves, so it stays round when drawn big. */
function wobblyCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rand: () => number, amount: number) {
  const n = 28
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 + (rand() - 0.5) * amount)
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  ctx.beginPath()
  const start = mid(pts[n - 1], pts[0])
  ctx.moveTo(start[0], start[1])
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n])
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
  }
  ctx.closePath()
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.min(255, Math.max(0, v + amt))
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`
}

/** Tiny gaps where crayon wax skips the paper: drawn once, then tiled over every planet. */
let grainTile: HTMLCanvasElement | null = null
function paperGrain() {
  if (grainTile) return grainTile
  grainTile = makeCanvas(256, 256)
  const g = grainTile.getContext('2d')!
  const rand = rng(4242)
  g.fillStyle = '#000'
  for (let i = 0; i < 256 * 256 * 0.05; i++) {
    g.globalAlpha = 0.25 + rand() * 0.6
    g.fillRect(rand() * 256, rand() * 256, 1 + rand() * 1.2, 1)
  }
  return grainTile
}

/** Waxy crayon colouring: base wash, hatching strokes, a wobbly outline, and paper showing through. */
function crayonPlanet(body: Body, r: number): Sprite {
  const ringR = body.rings ? r * 2.3 : r
  const pad = r * 0.25 + 6
  const W = ringR * 2 + pad * 2
  const H = (body.rings ? Math.max(r * 2, ringR * 0.9) : r * 2) + pad * 2
  const c = makeCanvas(W, H)
  const ctx = c.getContext('2d')!
  const cx = W / 2
  const cy = H / 2
  const rand = rng(body.id)
  const [a, b] = body.colors

  const ring = (front: boolean) => {
    if (!body.rings) return
    ctx.save()
    ctx.lineCap = 'round'
    for (let pass = 0; pass < 3; pass++) {
      ctx.strokeStyle = pass === 1 ? shade(b, -10) : a
      ctx.globalAlpha = 0.75
      ctx.lineWidth = Math.max(1.5, r * 0.16)
      ctx.beginPath()
      const rx = r * (1.5 + pass * 0.3)
      const ry = rx * 0.3
      const start = front ? 0 : Math.PI
      for (let i = 0; i <= 40; i++) {
        const t = start + (i / 40) * Math.PI
        const j = 1 + (rand() - 0.5) * 0.04
        const x = cx + Math.cos(t) * rx * j
        const y = cy + Math.sin(t) * ry * j
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  ring(false)

  // Body fill, clipped to a slightly wobbly circle.
  ctx.save()
  wobblyCircle(ctx, cx, cy, r, rand, 0.06)
  ctx.clip()
  ctx.fillStyle = a
  ctx.globalAlpha = 0.85
  ctx.fillRect(cx - r - 2, cy - r - 2, r * 2 + 4, r * 2 + 4)

  // Hatching, like colouring in with the side of a crayon. Capped so big drawings stay quick and don't turn solid.
  ctx.lineCap = 'round'
  const strokes = Math.round(Math.min(r * 5, 900))
  for (let i = 0; i < strokes; i++) {
    const t = rand()
    ctx.strokeStyle = t < 0.45 ? b : t < 0.8 ? shade(a, 25) : shade(b, -25)
    ctx.globalAlpha = 0.18 + rand() * 0.35
    ctx.lineWidth = 1 + rand() * Math.max(1.5, r * 0.08)
    const x = cx - r + rand() * r * 2
    const y = cy - r + rand() * r * 2
    const len = r * (0.3 + rand() * 0.6)
    ctx.beginPath()
    ctx.moveTo(x - len * 0.8, y + len * 0.35)
    ctx.lineTo(x + len * 0.8, y - len * 0.35)
    ctx.stroke()
  }

  if (body.banded) {
    for (let y = cy - r; y < cy + r; y += r * (0.18 + rand() * 0.2)) {
      ctx.strokeStyle = rand() > 0.5 ? shade(b, -20) : shade(a, 20)
      ctx.globalAlpha = 0.55
      ctx.lineWidth = r * (0.06 + rand() * 0.1)
      ctx.beginPath()
      ctx.moveTo(cx - r, y)
      for (let x = cx - r; x <= cx + r; x += r / 6) ctx.lineTo(x, y + (rand() - 0.5) * r * 0.06)
      ctx.stroke()
    }
    if (body.id === 'jupiter') {
      ctx.fillStyle = '#c2553a'
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.ellipse(cx + r * 0.3, cy + r * 0.25, r * 0.26, r * 0.13, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (body.id === 'earth') {
    ctx.fillStyle = '#58c26f'
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.85
      wobblyCircle(ctx, cx - r * 0.6 + rand() * r * 1.2, cy - r * 0.5 + rand() * r, r * (0.2 + rand() * 0.2), rand, 0.5)
      ctx.fill()
    }
  }

  if (body.id === 'moon' || body.id === 'mercury') {
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = shade(b, -30)
      ctx.globalAlpha = 0.6
      ctx.lineWidth = Math.max(1.2, r * 0.02)
      wobblyCircle(ctx, cx - r * 0.6 + rand() * r * 1.2, cy - r * 0.6 + rand() * r * 1.2, r * (0.08 + rand() * 0.14), rand, 0.3)
      ctx.stroke()
    }
  }

  // Night side: darker hatching towards the lower right (the Sun has none).
  if (body.id !== 'sun') {
    ctx.lineWidth = Math.max(1, r * 0.06)
    const nightStrokes = Math.min(strokes * 0.6, 130)
    for (let i = 0; i < nightStrokes; i++) {
      const t = rand()
      const ang = Math.PI * (0.05 + rand() * 0.6)
      const dist = r * (0.55 + t * 0.5)
      const x = cx + Math.cos(ang) * dist
      const y = cy + Math.sin(ang) * dist
      ctx.strokeStyle = '#0b0e2a'
      ctx.globalAlpha = 0.12 + t * 0.2
      ctx.beginPath()
      ctx.moveTo(x - r * 0.25, y + r * 0.1)
      ctx.lineTo(x + r * 0.25, y - r * 0.1)
      ctx.stroke()
    }
  }
  ctx.restore()

  // Wobbly outline, drawn twice like a child going round again.
  ctx.save()
  ctx.strokeStyle = shade(b, -45)
  ctx.lineWidth = Math.max(1.4, 1 + r * 0.045)
  ctx.globalAlpha = 0.8
  wobblyCircle(ctx, cx, cy, r, rand, 0.05)
  ctx.stroke()
  ctx.globalAlpha = 0.4
  wobblyCircle(ctx, cx + 0.8, cy - 0.6, r * 1.01, rand, 0.06)
  ctx.stroke()
  ctx.restore()

  ring(true)

  // Wax doesn't fill every bump in the paper: punch tiny gaps.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.translate(-rand() * 256, -rand() * 256)
  ctx.fillStyle = ctx.createPattern(paperGrain(), 'repeat')!
  ctx.fillRect(0, 0, W + 256, H + 256)
  ctx.restore()
  return { canvas: c, cx, cy, r }
}

/** A small drawing of one body, for legends and cards. Returns a data URL. */
export function crayonPlanetImage(id: string, radius = 40): string {
  if (PAINTED.has(id)) return paintedUrl(id, 'webp')
  const body = ALL.find((b) => b.id === id)
  if (!body) return ''
  return crayonPlanet(body, radius).canvas.toDataURL()
}

export function mountCrayonSky(canvas: HTMLCanvasElement, opts: SkyOptions = {}): SkyHandle {
  const o = { center: [0.5, 0.52] as [number, number], fill: 0.62, tilt: 0.36, maxZoom: 1, ...opts }
  const ctx = canvas.getContext('2d')!
  const still = reducedMotion()
  let w = 0
  let h = 0
  let dpr = 1
  let s = 1
  let sprites: Record<string, Sprite> = {}
  let closeUps: Record<string, Sprite> = {}
  let backdrop: HTMLCanvasElement | null = null
  let yaw = 0
  let time = 0
  let last = performance.now()
  let selected: string | null = null
  let hovered: string | null = null
  let positions: SkyPositions = {}
  let zoom = 1
  let raf = 0
  let alive = true

  /* ---------- Follow camera ----------
   * screen = (p - c) * k + a, applied on top of the normal layout (identity when k = 1 and c = a). */
  const SPRITE_CAP = 700
  let cam = { k: 1, cx: 0, cy: 0, ax: 0, ay: 0 }
  let focusId: string | null = null
  let pivotId: string | null = null
  let trans: { from: typeof cam; t0: number; dur: number } | null = null
  const extentOf = (b: Body) => (b.rings ? 2.2 : b.id === 'sun' ? 1.65 : 1)
  const findBody = (id: string) => ALL.find((b) => b.id === id)

  const makeSprite = (body: Body, r: number) => crayonPlanet(body, r)

  /* ---------- Painted worlds ----------
   * The still shows straight away; the video takes over once it has a frame. With reduced motion only the still is used. */
  const painted: Record<string, { still: HTMLImageElement; video: HTMLVideoElement | null }> = {}
  for (const id of PAINTED) {
    const img = new Image()
    img.src = paintedUrl(id, 'webp')
    let video: HTMLVideoElement | null = null
    if (!still) {
      video = document.createElement('video')
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      video.preload = 'auto'
      video.src = paintedUrl(id, 'mp4')
      video.play().catch(() => undefined) // blocked autoplay just leaves the still showing
    }
    painted[id] = { still: img, video }
  }
  /** Draws a painted world at (x, y) with radius r. False when nothing has loaded yet, so the crayon drawing stands in. */
  function drawPainted(id: string, x: number, y: number, r: number) {
    const p = painted[id]
    if (!p) return false
    const half = r / DISC
    if (p.video && p.video.readyState >= 2) {
      // The video has a black square around the world, so cut it to a circle.
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(p.video, x - half, y - half, half * 2, half * 2)
      ctx.restore()
      return true
    }
    if (p.still.complete && p.still.naturalWidth) {
      ctx.drawImage(p.still, x - half, y - half, half * 2, half * 2)
      return true
    }
    return false
  }

  function closeUpSize(body: Body) {
    let r = (o.focus!(body, w, h).r / extentOf(body)) * dpr * 1.05
    // Earth looms large behind the Moon when the Moon is followed.
    if (body.id === 'earth') r = Math.max(r, (o.focus!(MOON_BODY, w, h).r / extentOf(MOON_BODY)) * dpr * 3.4)
    return Math.min(SPRITE_CAP, r)
  }
  function prepareCloseUp(body: Body | undefined) {
    if (!body || !o.focus || PAINTED.has(body.id)) return
    const r = closeUpSize(body)
    if (closeUps[body.id] && closeUps[body.id].r >= r * 0.95) return
    const sp = makeSprite(body, r)
    // Reading one pixel makes the browser paint the canvas now, not on the frame right after a tap.
    sp.canvas.getContext('2d')!.getImageData(0, 0, 1, 1)
    closeUps[body.id] = sp
  }
  /** Close-ups are drawn in spare moments after load, so tapping a planet never waits for one. */
  let warmJob = 0
  function warmCloseUps() {
    if (!o.focus) return
    const job = ++warmJob
    const queue = [...ALL]
    const later = (cb: () => void) =>
      'requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 500 }) : setTimeout(cb, 50)
    const next = () => {
      if (!alive || job !== warmJob || !queue.length) return
      prepareCloseUp(queue.shift())
      later(next)
    }
    later(next)
  }
  function prepareFocus(id: string) {
    prepareCloseUp(findBody(id))
    if (id === 'moon') prepareCloseUp(findBody('earth'))
  }
  function setFocus(id: string | null) {
    if (!o.focus || id === focusId) return
    focusId = id
    if (id) {
      pivotId = id
      prepareFocus(id)
    }
    trans = { from: { ...cam }, t0: performance.now(), dur: still ? 0 : 1300 }
  }
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  function updateCamera(now: number, raw: Record<string, { x: number; y: number; r: number }>, cx: number, cy: number) {
    const piv = raw[(focusId || pivotId) ?? '']
    if (!piv) {
      cam = { k: 1, cx, cy, ax: cx, ay: cy }
      return
    }
    let k1 = 1
    let ex = piv.x
    let ey = piv.y
    if (focusId && o.focus) {
      const body = findBody(focusId)!
      const t = o.focus(body, w, h)
      k1 = t.r / extentOf(body) / piv.r
      ex = t.x
      ey = t.y + Math.sin(time * 1.3) * Math.min(6, t.r * 0.04) // gentle hover
    }
    const e = trans ? easeInOut(trans.dur ? Math.min(1, (now - trans.t0) / trans.dur) : 1) : 1
    if (!trans || e >= 1) {
      cam = { k: k1, cx: piv.x, cy: piv.y, ax: ex, ay: ey }
      trans = null
      if (!focusId) pivotId = null
      return
    }
    // Mid-flight: the body glides in a straight line to the anchor while the zoom grows smoothly.
    const f = trans.from
    const sx = (piv.x - f.cx) * f.k + f.ax
    const sy = (piv.y - f.cy) * f.k + f.ay
    cam = {
      k: Math.exp(Math.log(f.k) * (1 - e) + Math.log(k1) * e),
      cx: piv.x,
      cy: piv.y,
      ax: sx + (ex - sx) * e,
      ay: sy + (ey - sy) * e,
    }
  }

  function layout() {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    w = rect.width
    h = rect.height
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    s = Math.min(w * o.fill, h * 1.5) / MAX_ORBIT
    sprites = {}
    for (const body of ALL) sprites[body.id] = makeSprite(body, body.size * s * 1.3 * dpr * o.maxZoom)
    closeUps = {}
    if (focusId) prepareFocus(focusId)
    warmCloseUps()
    buildBackdrop()
  }

  /** Doodled stars never move, so they're drawn once. */
  function buildBackdrop() {
    backdrop = makeCanvas(w * dpr, h * dpr)
    const b = backdrop.getContext('2d')!
    b.scale(dpr, dpr)
    const rand = rng(99)
    const count = Math.round((w * h) / 2600)
    b.lineCap = 'round'
    for (let i = 0; i < count; i++) {
      const x = rand() * w
      const y = rand() * h
      const r = rand()
      if (r > 0.94) {
        const size = 4 + r * 6
        b.strokeStyle = r > 0.97 ? '#ffd447' : '#f7f3e8'
        b.lineWidth = 1.6
        b.globalAlpha = 0.9
        b.beginPath()
        b.moveTo(x - size, y + (rand() - 0.5))
        b.lineTo(x + size, y + (rand() - 0.5))
        b.moveTo(x + (rand() - 0.5), y - size)
        b.lineTo(x + (rand() - 0.5), y + size)
        b.stroke()
      } else {
        b.fillStyle = '#f7f3e8'
        b.globalAlpha = 0.25 + r * 0.5
        b.fillRect(x, y, 1 + r * 1.6, 1 + r * 1.2)
      }
    }
    b.globalAlpha = 1
  }

  /** Wobbly orbit lines, gone over twice. Same seed every frame so the wobble holds still; it shrinks as the camera zooms. */
  function drawOrbits(cx: number, cy: number, S: number, camK: number) {
    ctx.save()
    ctx.lineCap = 'round'
    const rand = rng(99)
    for (const body of BODIES) {
      if (!body.orbit) continue
      for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = '#f7f3e8'
        ctx.globalAlpha = pass ? 0.12 : 0.2
        ctx.lineWidth = pass ? 2.4 : 1.3
        ctx.beginPath()
        const rx = body.orbit * S
        const ry = rx * o.tilt
        const n = 120
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * Math.PI * 2
          const j = 1 + ((rand() - 0.5) * 0.012) / camK
          const x = cx + Math.cos(t) * rx * j
          const y = cy + Math.sin(t) * ry * j
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  function frame(now: number) {
    if (!alive) return
    raf = requestAnimationFrame(frame)
    if (!w) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!still) time += dt
    const cx = w * o.center[0]
    const cy = h * o.center[1]

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (backdrop) ctx.drawImage(backdrop, 0, 0, w, h)
    const S = s * zoom

    // Lay the bodies out as if there were no camera, then let the camera move and scale everything.
    const items: { body: Body; x: number; z: number }[] = []
    for (const body of BODIES) {
      const angle = ((body.orbit * 1.7) % (Math.PI * 2)) + time * 0.12 * body.speed + yaw
      const p = { x: Math.cos(angle) * body.orbit, z: Math.sin(angle) * body.orbit }
      items.push({ body, ...p })
      if (body.id === 'earth') {
        const m = time * 0.8 + yaw
        items.push({ body: MOON_BODY, x: p.x + Math.cos(m) * 1.25, z: p.z + Math.sin(m) * 1.25 })
      }
    }
    items.sort((a, b) => a.z - b.z)
    const raw: Record<string, { x: number; y: number; r: number }> = {}
    for (const it of items) {
      const persp = 1 + (it.z / MAX_ORBIT) * 0.3
      raw[it.body.id] = { x: cx + it.x * S, y: cy + it.z * S * o.tilt, r: it.body.size * S * persp }
    }
    updateCamera(now, raw, cx, cy)
    const K = cam.k
    const toX = (x: number) => (x - cam.cx) * K + cam.ax
    const toY = (y: number) => (y - cam.cy) * K + cam.ay
    const sunX = toX(cx)
    const sunY = toY(cy)
    drawOrbits(sunX, sunY, S * K, K)

    // The selected planet's orbit, in dashed yellow crayon.
    const sel = selected === 'moon' ? 'earth' : selected
    const selBody = BODIES.find((b) => b.id === sel)
    if (selBody?.orbit) {
      ctx.save()
      ctx.strokeStyle = '#ffd447'
      ctx.globalAlpha = 0.75
      ctx.lineWidth = 3
      ctx.setLineDash([10, 7])
      ctx.beginPath()
      ctx.ellipse(sunX, sunY, selBody.orbit * S * K, selBody.orbit * S * K * o.tilt, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    positions = {}
    for (const it of items) {
      const q = raw[it.body.id]
      const X = toX(q.x)
      const Y = toY(q.y)
      const r = q.r * K
      const ext = r * extentOf(it.body)
      positions[it.body.id] = { x: X, y: Y, r, ext }
      const m = ext * 1.7 + 4
      if (X + m < 0 || X - m > w || Y + m < 0 || Y - m > h) continue // off screen

      if (it.body.id === 'sun') {
        // Scribbled rays that wiggle slowly.
        ctx.save()
        ctx.strokeStyle = '#ffb347'
        ctx.lineCap = 'round'
        ctx.lineWidth = 3 * Math.min(3, Math.sqrt(zoom * K))
        ctx.globalAlpha = 0.85
        const rays = 14
        for (let i = 0; i < rays; i++) {
          const a = (i / rays) * Math.PI * 2 + Math.sin(time * 0.6) * 0.04
          const r1 = r * 1.18
          const r2 = r * (1.45 + (i % 2) * 0.18)
          ctx.beginPath()
          ctx.moveTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1)
          ctx.lineTo(X + Math.cos(a + 0.03) * r2, Y + Math.sin(a + 0.03) * r2)
          ctx.stroke()
        }
        ctx.restore()
      }

      const far = sprites[it.body.id]
      const near = closeUps[it.body.id]
      const sp = near && far && r * dpr > far.r * 1.15 ? near : far
      if (!drawPainted(it.body.id, X, Y, r) && sp) {
        const k = r / sp.r
        ctx.drawImage(sp.canvas, X - sp.cx * k, Y - sp.cy * k, sp.canvas.width * k, sp.canvas.height * k)
      }

      // Hover/selection ring, except on the body the camera is following.
      const followed = o.focus && it.body.id === focusId
      if (!followed && (it.body.id === hovered || it.body.id === selected)) {
        ctx.save()
        ctx.strokeStyle = '#ffd447'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.arc(X, Y, r + 7, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }

    o.onFrame?.(positions)
  }

  function hit(px: number, py: number) {
    let best: (SkyPos & { id: string }) | null = null
    for (const id in positions) {
      const p = positions[id]
      const d = Math.hypot(px - p.x, py - p.y)
      if (d < Math.max(p.r + 6, 16) && (!best || p.r < best.r)) best = { id, ...p }
    }
    return best
  }

  // Pointer: drag sideways to spin, tap to select.
  let drag: { x: number; yaw: number; moved: boolean } | null = null
  const onDown = (e: PointerEvent) => {
    drag = { x: e.clientX, yaw, moved: false }
  }
  const onMove = (e: PointerEvent) => {
    if (drag) {
      const dx = e.clientX - drag.x
      if (Math.abs(dx) > 4) drag.moved = true
      yaw = drag.yaw + dx * 0.006
    }
    const rect = canvas.getBoundingClientRect()
    const hb = e.target === canvas ? hit(e.clientX - rect.left, e.clientY - rect.top) : null
    const id = hb?.id ?? null
    if (id !== hovered) {
      hovered = id
      canvas.style.cursor = id ? 'pointer' : 'grab'
    }
  }
  const onUp = (e: PointerEvent) => {
    if (!drag) return
    const wasDrag = drag.moved
    drag = null
    if (wasDrag || e.target !== canvas) return
    const rect = canvas.getBoundingClientRect()
    const hb = hit(e.clientX - rect.left, e.clientY - rect.top)
    selected = hb ? hb.id : null
    setFocus(selected)
    o.onSelect?.(selected ? (findBody(selected) ?? null) : null)
  }

  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  const ro = new ResizeObserver(() => layout())
  ro.observe(canvas)
  layout()
  raf = requestAnimationFrame(frame)

  return {
    select(id) {
      selected = id
      setFocus(id)
    },
    setZoom(z) {
      zoom = Math.max(1, Math.min(o.maxZoom, z))
    },
    destroy() {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      for (const { video } of Object.values(painted)) {
        if (!video) continue
        video.pause()
        video.removeAttribute('src')
        video.load() // lets the browser drop the download
      }
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    },
  }
}
