/**
 * ym's painted, gently moving worlds (public/planets): a looping video and a see-through still for each.
 * Used by the solar system drawing and the Moon and Mars game maps.
 */

export const paintedUrl = (id: string, ext: 'mp4' | 'webp') => `${import.meta.env.BASE_URL}planets/${id}.${ext}`

/** How much of a round painted picture's width the world fills. */
export const DISC = 0.975

/** Where the round world sits in its picture, so it lines up with the planet's size in the drawing. */
export interface PaintedArt {
  /** Picture width ÷ height. */
  aspect: number
  /** The world's centre, as fractions of the picture's width and height. */
  cx: number
  cy: number
  /** The world's radius, as a fraction of the picture's width. */
  r: number
  /**
   * A cut-out for pictures that are more than a round world (Saturn's rings), in public/planets/<id>-mask.png.
   * Round pictures are simply cut to a circle.
   */
  mask?: boolean
}

const ROUND: PaintedArt = { aspect: 1, cx: 0.5, cy: 0.5, r: DISC / 2 }

export const PAINTED: Record<string, PaintedArt> = {
  sun: ROUND,
  mercury: ROUND,
  venus: ROUND,
  earth: ROUND,
  moon: ROUND,
  mars: ROUND,
  jupiter: ROUND,
  // Measured from ym's video: a 1024 × 556 picture with the ball in the middle and the rings reaching both sides,
  // with a little room past the faint ring tips so they are never cut off.
  saturn: { aspect: 1024 / 556, cx: 0.506, cy: 0.5, r: 0.262, mask: true },
  uranus: ROUND,
  neptune: ROUND,
}

export const isPainted = (id: string) => Object.hasOwn(PAINTED, id)

export const paintedMaskUrl = (id: string) => `${import.meta.env.BASE_URL}planets/${id}-mask.png`
