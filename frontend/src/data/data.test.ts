import { describe, expect, it } from 'vitest'
import { STATUS_LABELS, WORLD_LABELS } from '../types/artifact'
import { artifactById, artifacts, dateSortKey, FEATURED_IDS, formatDate } from './index'
import glossary from './glossary.json'
import { BODIES, MOON_BODY } from './planets'
import { QUIZ, SCIENCE_TOPICS } from './science'

const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/
const ROUTES = ['/moon', '/mars', '/deep-space']

describe('artifact records', () => {
  it('have unique ids', () => {
    const ids = artifacts.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(artifacts.map((a) => [a.id, a] as const))('%s is complete and well-formed', (_, a) => {
    expect(Object.keys(WORLD_LABELS)).toContain(a.world)
    expect(Object.keys(STATUS_LABELS)).toContain(a.status)
    expect(a.launchDate).toMatch(DATE)
    for (const d of [a.arrivalDate, a.endDate].filter(Boolean)) {
      expect(d).toMatch(DATE)
      expect(dateSortKey(d!) >= a.launchDate).toBe(true)
    }
    for (const e of a.timeline) expect(e.date).toMatch(DATE)
    expect(a.story.length).toBeGreaterThan(0)
    expect(a.instruments.length).toBeGreaterThan(0)
    expect(a.discoveries.length).toBeGreaterThan(0)
    expect(a.sources.length).toBeGreaterThan(0)
    for (const s of a.sources) expect(s.url).toMatch(/^https:\/\//)
  })

  it('only marks spacecraft without an end date as operational', () => {
    for (const a of artifacts) {
      if (a.status === 'operational') expect(a.endDate).toBeUndefined()
      else expect(a.endDate).toBeDefined()
    }
  })
})

describe('cross-references', () => {
  it('featured, science and planet links point to real pages', () => {
    for (const id of FEATURED_IDS) expect(artifactById(id)).toBeDefined()
    for (const t of SCIENCE_TOPICS) for (const id of t.relatedArtifacts) expect(artifactById(id), `${t.id} → ${id}`).toBeDefined()
    for (const b of [...BODIES, MOON_BODY]) {
      if (!b.archive) continue
      const to = b.archive.to
      expect(ROUTES.includes(to) || Boolean(artifactById(to.replace('/artifact/', ''))), `${b.id} → ${to}`).toBe(true)
    }
  })

  it('quiz answers are valid options', () => {
    for (const q of QUIZ) expect(q.options[q.answer]).toBeDefined()
  })

  it('glossary terms are unique', () => {
    const terms = glossary.map((g) => g.term.toLowerCase())
    expect(new Set(terms).size).toBe(terms.length)
  })
})

describe('dates', () => {
  it('formats full, month and year precision', () => {
    expect(formatDate('1969-07-20')).toBe('20 Jul 1969')
    expect(formatDate('1982-11')).toBe('Nov 1982')
    expect(formatDate('2005')).toBe('2005')
    expect(formatDate(undefined)).toBe('—')
  })

  it('sorts month-only dates after exact dates in the same month', () => {
    const sorted = ['1967-04', '1967-04-20', '1967-04-17'].sort((a, b) => dateSortKey(a).localeCompare(dateSortKey(b)))
    expect(sorted).toEqual(['1967-04-17', '1967-04-20', '1967-04'])
  })
})
