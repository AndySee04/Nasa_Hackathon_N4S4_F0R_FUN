import { describe, expect, it } from 'vitest'
import { artifactById } from '../data'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { MOON_FACT_SOURCES, MOON_FACTS } from '../data/campaigns/moonFacts'
import { MIN_PIN_GAP, projectNearSide, spreadPins } from './moonMap'

describe('near-side projection', () => {
  it('puts the centre, north, east and west in the right places', () => {
    expect(projectNearSide(0, 0)).toEqual({ x: 50, y: 50 })
    expect(projectNearSide(90, 0).y).toBeCloseTo(0)
    expect(projectNearSide(0, 90).x).toBeCloseTo(100)
    expect(projectNearSide(0, -90).x).toBeCloseTo(0)
  })

  it('places Apollo 11 east of centre and Apollo 15 in the north', () => {
    const a11 = artifactById('apollo-11-eagle')!.location
    const a15 = artifactById('apollo-15-falcon')!.location
    expect(projectNearSide(a11.lat!, a11.lon!).x).toBeGreaterThan(60)
    expect(projectNearSide(a15.lat!, a15.lon!).y).toBeLessThan(35)
  })
})

describe('pin spreading', () => {
  it('separates Intrepid and Surveyor 3, which landed about 180 m apart', () => {
    const levels = [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]
    const raw = levels.map((l) => {
      const loc = artifactById(l.artifactId)!.location
      return projectNearSide(loc.lat!, loc.lon!)
    })
    const { points, nudged } = spreadPins(raw)
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++)
        expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThanOrEqual(MIN_PIN_GAP - 0.01)
    expect(nudged[levels.findIndex((l) => l.artifactId === 'surveyor-3')]).toBe(true)
    for (const p of points) expect(Math.hypot(p.x - 50, p.y - 50)).toBeLessThan(50)
  })

  it('leaves pins alone when they are far apart, and handles identical points', () => {
    const far = spreadPins([{ x: 10, y: 10 }, { x: 80, y: 80 }])
    expect(far.nudged).toEqual([false, false])
    const same = spreadPins([{ x: 50, y: 50 }, { x: 50, y: 50 }])
    expect(Math.abs(same.points[0].y - same.points[1].y)).toBeGreaterThanOrEqual(MIN_PIN_GAP - 0.01)
  })
})

describe('Moon facts', () => {
  it('cite NASA sources', () => {
    expect(MOON_FACTS.length).toBeGreaterThanOrEqual(6)
    for (const s of MOON_FACT_SOURCES) expect(s.url).toMatch(/^https:\/\/(nssdc\.gsfc|science)\.nasa\.gov\//)
  })
})
