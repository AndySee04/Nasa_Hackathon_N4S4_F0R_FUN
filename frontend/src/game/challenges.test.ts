import { describe, expect, it } from 'vitest'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { isNextInOrder, orderOf, pairsOf, shuffled, tryAgain } from './challenges'

const levels = [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]

describe('shuffle', () => {
  it('keeps every item, is repeatable, and never leaves the answer in order', () => {
    const items = ['a', 'b', 'c', 'd']
    const s = shuffled(items, 'x')
    expect([...s].sort()).toEqual(items)
    expect(shuffled(items, 'x')).toEqual(s)
    for (const seed of ['1', '2', '3', 'apollo', 'surveyor']) expect(shuffled(items, seed)).not.toEqual(items)
  })
})

describe('every level has a playable repair', () => {
  it.each(levels.map((l) => [l.artifactId, l.repair] as const))('%s', (_, repair) => {
    const pairs = pairsOf(repair)
    const { correct, shown } = orderOf(repair)
    if (repair.kind === 'drag-parts' || repair.kind === 'match-instruments') {
      expect(pairs.length).toBeGreaterThanOrEqual(3)
      expect(new Set(pairs.map((p) => p.target)).size).toBe(pairs.length)
    } else {
      expect(correct.length).toBeGreaterThanOrEqual(3)
      expect([...shown].sort()).toEqual([...correct].sort())
    }
  })
})

describe('order checks and feedback', () => {
  it('accepts only the next correct step', () => {
    expect(isNextInOrder(['a', 'b', 'c'], [], 'a')).toBe(true)
    expect(isNextInOrder(['a', 'b', 'c'], ['a'], 'c')).toBe(false)
    expect(isNextInOrder(['a', 'b', 'c'], ['a'], 'b')).toBe(true)
  })

  it('is always kind', () => {
    for (let i = 0; i < 6; i++) expect(tryAgain(i)).not.toMatch(/wrong/i)
  })
})
