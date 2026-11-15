/**
 * Rules for the pretend repair challenges and the quiz. Pure functions, tested without a browser.
 * Mistakes never fail a challenge: the child keeps trying with a gentle clue, and finishing earns the star.
 */
import type { RepairChallenge } from '../types/campaign'

/** A repeatable shuffle (same seed, same order) that never returns the original order for 2+ items. */
export function shuffled<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h ^= h >>> 13
    return (h >>> 0) / 4294967296
  }
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift()!)
  return out
}

/** A pairing challenge (parts to slots, or instruments to jobs) as plain pairs. */
export interface Pair {
  id: string
  item: string
  target: string
}

export function pairsOf(challenge: RepairChallenge): Pair[] {
  if (challenge.kind === 'drag-parts') return challenge.slots.map((s) => ({ id: s.id, item: s.label, target: s.hint }))
  if (challenge.kind === 'match-instruments') return challenge.pairs.map((p, i) => ({ id: String(i), item: p.instrument, target: p.job }))
  return []
}

/** The ordered steps of a sequence or circuit challenge. */
export function orderOf(challenge: RepairChallenge): { correct: string[]; shown: string[] } {
  if (challenge.kind === 'sequence') return { correct: challenge.steps, shown: challenge.steps }
  if (challenge.kind === 'circuit') return { correct: challenge.correctPath, shown: challenge.nodes }
  return { correct: [], shown: [] }
}

/** Is `next` the right step to add after the ones already placed? */
export function isNextInOrder(correct: readonly string[], placed: readonly string[], next: string): boolean {
  return correct[placed.length] === next
}

/** Kind words for a mistake. Never "Wrong!". */
export const TRY_AGAIN = ['Good try! Have another look.', 'Nearly! Read the clue again.', 'Not that one, but keep going!'] as const

export const tryAgain = (mistakes: number): string => TRY_AGAIN[mistakes % TRY_AGAIN.length]
