import { spreadPins, type MapPoint } from './moonMap'

/** Latitude/longitude in degrees to percent across and down a flat (equirectangular) map of Mars. */
export function projectMars(lat: number, lon: number): MapPoint {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

/** Spreads pins on the 2:1 map so each is at least about 44 px apart, then keeps them inside the edges. */
export function spreadMarsPins(points: MapPoint[]): { points: MapPoint[]; nudged: boolean[] } {
  const squashed = points.map((p) => ({ x: p.x, y: p.y / 2 }))
  const spread = spreadPins(squashed, 8.5)
  return {
    points: spread.points.map((p) => ({ x: Math.min(95, Math.max(5, p.x)), y: Math.min(90, Math.max(10, p.y * 2)) })),
    nudged: spread.nudged,
  }
}

const RAD = Math.PI / 180
/** Where the round Mars picture is centred. Chosen so every landing site sits well inside the edge. */
const GLOBE_LAT = 55
const GLOBE_LON = 95

/**
 * Latitude/longitude in degrees to percent across and down the round Mars picture.
 * Uses a whole-planet (Lambert azimuthal equal-area) view, so sites on every side of Mars fit on one ball;
 * sites on the far side sit nearer the edge.
 */
export function projectMarsGlobe(lat: number, lon: number): MapPoint {
  const la = lat * RAD
  const dl = (lon - GLOBE_LON) * RAD
  const la0 = GLOBE_LAT * RAD
  const cosC = Math.sin(la0) * Math.sin(la) + Math.cos(la0) * Math.cos(la) * Math.cos(dl)
  const k = Math.sqrt(2 / Math.max(1e-6, 1 + cosC)) / 2 // 0 at the centre, 1 at the far point
  const x = k * Math.cos(la) * Math.sin(dl)
  const y = k * (Math.cos(la0) * Math.sin(la) - Math.sin(la0) * Math.cos(la) * Math.cos(dl))
  return { x: 50 + x * 48, y: 50 - y * 48 }
}
