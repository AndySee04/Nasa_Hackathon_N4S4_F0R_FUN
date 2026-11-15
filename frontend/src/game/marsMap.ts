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
