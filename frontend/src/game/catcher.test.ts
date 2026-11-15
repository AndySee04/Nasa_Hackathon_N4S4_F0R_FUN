import { describe, expect, it } from 'vitest'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { CLAW_MAX, CLAW_MIN, clampClaw, drop, hintFor, layoutFor, TOLERANCE } from './catcher'

const ids = [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts].map((a) => a.artifactId)

describe('field layout', () => {
  it.each(ids)('%s: target is reachable, off-centre, and clear of rocks', (id) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { target, rocks } = layoutFor(id, attempt)
      expect(target).toBeGreaterThanOrEqual(CLAW_MIN)
      expect(target).toBeLessThanOrEqual(CLAW_MAX)
      expect(Math.abs(target - 50)).toBeGreaterThan(TOLERANCE.easy)
      expect(rocks).toHaveLength(2)
      for (const r of rocks) expect(Math.abs(r - target)).toBeGreaterThanOrEqual(22)
    }
  })

  it('is the same every time for the same artifact and attempt', () => {
    expect(layoutFor('surveyor-3', 1)).toEqual(layoutFor('surveyor-3', 1))
  })
})

describe('dropping the claw', () => {
  const layout = { target: 30, rocks: [60, 80] }

  it('catches within tolerance and snaps onto the machine', () => {
    expect(drop(30, layout, false)).toEqual({ kind: 'catch', snapTo: 30 })
    expect(drop(30 + TOLERANCE.normal, layout, false).kind).toBe('catch')
    expect(drop(30 + TOLERANCE.normal + 1, layout, false).kind).toBe('miss')
  })

  it('is kinder in easy mode', () => {
    expect(drop(30 + TOLERANCE.easy, layout, true)).toEqual({ kind: 'catch', snapTo: 30 })
  })

  it('reports a rock separately from an empty miss', () => {
    expect(drop(61, layout, false)).toEqual({ kind: 'rock', rock: 60 })
    expect(drop(45, layout, false)).toEqual({ kind: 'miss' })
  })

  it('keeps the claw on screen', () => {
    expect(clampClaw(-20)).toBe(CLAW_MIN)
    expect(clampClaw(200)).toBe(CLAW_MAX)
  })
})

describe('hints', () => {
  const layout = { target: 70, rocks: [20, 40] }
  it('points the right way and says when you are above it', () => {
    expect(hintFor(20, layout, true)).toBe('The signal is a long way to the right.')
    expect(hintFor(80, layout, false)).toBe('The signal is a little to the left.')
    expect(hintFor(66, layout, true)).toMatch(/right above it/)
  })
})
