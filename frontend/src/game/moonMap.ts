/**
 * Places landing sites on a drawing of the Moon's near side (the side that always faces Earth).
 * Uses an orthographic projection: what you would see looking at the Moon from far away.
 */

export interface MapPoint {
  /** Percent across the Moon picture, 0 = left edge, 100 = right edge. */
  x: number
  /** Percent down the Moon picture, 0 = top edge, 100 = bottom edge. */
  y: number
}

const RAD = Math.PI / 180

/** Latitude/longitude in degrees (north and east positive) to a point on the near-side disc. */
export function projectNearSide(lat: number, lon: number): MapPoint {
  const x = Math.cos(lat * RAD) * Math.sin(lon * RAD)
  const y = Math.sin(lat * RAD)
  return { x: 50 + x * 50, y: 50 - y * 50 }
}

/** The minimum distance between two pins, in percent of the picture: 13% of a 340 px phone Moon is a 44 px finger target. */
export const MIN_PIN_GAP = 13

/**
 * Pushes pins apart when they would overlap. Real sites can be very close
 * (Intrepid landed about 180 m from Surveyor 3), so the picture nudges them and says so.
 * Returns the moved points in the same order, plus which ones were nudged.
 */
export function spreadPins(points: MapPoint[], gap = MIN_PIN_GAP): { points: MapPoint[]; nudged: boolean[] } {
  const out = points.map((p) => ({ ...p }))
  const nudged = points.map(() => false)
  for (let pass = 0; pass < 20; pass++) {
    let moved = false
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x
        const dy = out[j].y - out[i].y
        const dist = Math.hypot(dx, dy)
        if (dist >= gap) continue
        // Push apart along the line between them (or sideways if they sit exactly on top of each other).
        const [ux, uy] = dist > 0.001 ? [dx / dist, dy / dist] : [0, 1]
        const push = (gap - dist) / 2
        out[i] = { x: out[i].x - ux * push, y: out[i].y - uy * push }
        out[j] = { x: out[j].x + ux * push, y: out[j].y + uy * push }
        nudged[i] = nudged[j] = true
        moved = true
      }
    }
    if (!moved) break
  }
  return { points: out, nudged }
}
