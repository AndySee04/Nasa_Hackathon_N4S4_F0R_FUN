import { describe, expect, it } from 'vitest'
import { artifactById } from '../index'
import { MOON_CAMPAIGN } from './moon'

const levels = [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]

describe('Moon campaign data', () => {
  it('has four core artifacts (12 stars) and one bonus (15 with bonus)', () => {
    expect(MOON_CAMPAIGN.artifacts).toHaveLength(4)
    expect(MOON_CAMPAIGN.bonusArtifacts).toHaveLength(1)
  })

  it('never repeats an artifact', () => {
    const ids = levels.map((l) => l.artifactId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(levels.map((l) => [l.artifactId, l] as const))('%s points at a verified Moon record', (id, level) => {
    const a = artifactById(id)
    expect(a, `${id} missing from artifacts.json`).toBeDefined()
    expect(a!.world).toBe('moon')
    expect(a!.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(a!.sources.some((s) => /^https:\/\/(nssdc\.gsfc\.nasa\.gov|www\.nasa\.gov|science\.nasa\.gov)\//.test(s.url))).toBe(true)
    expect(level.science.points.length).toBeGreaterThan(0)
  })

  it.each(levels.map((l) => [l.artifactId, l] as const))('%s has exactly 3 valid quiz questions', (_, level) => {
    expect(level.quiz).toHaveLength(3)
    for (const q of level.quiz) {
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(q.options[q.answer]).toBeDefined()
      expect(q.explain.length).toBeGreaterThan(0)
    }
  })

  it('does not always put the right answer in the same place', () => {
    const answers = new Set(levels.flatMap((l) => l.quiz.map((q) => q.answer)))
    expect(answers.size).toBeGreaterThan(2)
  })

  it.each(levels.map((l) => [l.artifactId, l] as const))('%s has a solvable repair challenge', (_, { repair }) => {
    switch (repair.kind) {
      case 'drag-parts':
        expect(repair.slots.length).toBeGreaterThanOrEqual(2)
        expect(new Set(repair.slots.map((s) => s.id)).size).toBe(repair.slots.length)
        break
      case 'match-instruments':
        expect(repair.pairs.length).toBeGreaterThanOrEqual(2)
        expect(new Set(repair.pairs.map((p) => p.job)).size).toBe(repair.pairs.length)
        break
      case 'circuit':
        expect([...repair.correctPath].sort()).toEqual([...repair.nodes].sort())
        expect(repair.nodes).not.toEqual(repair.correctPath)
        break
      case 'sequence':
        expect(repair.steps.length).toBeGreaterThanOrEqual(3)
        expect(new Set(repair.steps).size).toBe(repair.steps.length)
        break
    }
  })
})
