/**
 * Rules for the rocket claw catcher (Stage 2). Pure functions, so they can be tested
 * without a browser. Positions are percentages across the play area (0 = left, 100 = right).
 */

export const CLAW_MIN = 6
export const CLAW_MAX = 94
export const CLAW_STEP = 4

/** How close the claw must be to grab. Easy mode is on by default for younger players. */
export const TOLERANCE = { easy: 12, normal: 6 } as const

/** Misses before the visible hint appears. */
export const HINT_AFTER_MISSES = 2

export interface FieldLayout {
  target: number
  rocks: number[]
}

/** A small, repeatable random number generator, so each artifact always has the same layout. */
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

/**
 * Places the machine and two moon rocks. The machine is never right under the starting
 * claw (the middle), and rocks keep a clear gap from it so a careful drop is never ambiguous.
 */
export function layoutFor(artifactId: string, attempt = 0): FieldLayout {
  const rand = seededRandom(`${artifactId}:${attempt}`)
  const side = rand() < 0.5 ? -1 : 1
  const target = Math.round(50 + side * (18 + rand() * 26)) // 6..32 on the left or 68..94 on the right
  const rocks: number[] = []
  for (let tries = 0; rocks.length < 2 && tries < 100; tries++) {
    const x = Math.round(12 + rand() * 76)
    if (Math.abs(x - target) >= 22 && rocks.every((r) => Math.abs(r - x) >= 14)) rocks.push(x)
  }
  return { target: clampClaw(target), rocks }
}

export const clampClaw = (x: number): number => Math.min(CLAW_MAX, Math.max(CLAW_MIN, x))

export type DropResult = { kind: 'catch'; snapTo: number } | { kind: 'rock'; rock: number } | { kind: 'miss' }

/** What happens when the claw drops at `x`. In easy mode the claw slides onto the machine if it is close. */
export function drop(x: number, layout: FieldLayout, easy: boolean): DropResult {
  const tol = easy ? TOLERANCE.easy : TOLERANCE.normal
  if (Math.abs(x - layout.target) <= tol) return { kind: 'catch', snapTo: layout.target }
  const rock = layout.rocks.find((r) => Math.abs(x - r) <= TOLERANCE.normal)
  return rock === undefined ? { kind: 'miss' } : { kind: 'rock', rock }
}

/** A friendly direction, used for the live hint (and always available to screen readers). */
export function hintFor(x: number, layout: FieldLayout, easy: boolean): string {
  const d = layout.target - x
  if (Math.abs(d) <= (easy ? TOLERANCE.easy : TOLERANCE.normal)) return 'You are right above it! Drop the claw.'
  const far = Math.abs(d) > 25 ? 'a long way' : 'a little'
  return `The signal is ${far} to the ${d < 0 ? 'left' : 'right'}.`
}
