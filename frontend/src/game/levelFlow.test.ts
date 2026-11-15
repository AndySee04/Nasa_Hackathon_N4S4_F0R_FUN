import { describe, expect, it } from 'vitest'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { nextSignal, nextStep } from './levelFlow'
import { emptyProgress, recordResult } from './progress'

const caught = { caught: true, repaired: false, quizCorrect: 0 }

describe('level steps', () => {
  it('goes catch → mission card → real story → done, skipping steps not built yet', () => {
    expect(nextStep('catch')).toBe('discovery')
    expect(nextStep('discovery')).toBe('science')
    expect(nextStep('science')).toBe('complete')
    expect(nextStep('complete')).toBe('complete')
  })
})

describe('next signal', () => {
  it('suggests the next uncaught signal, wrapping around, then the bonus, then none', () => {
    let p = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', caught)
    expect(nextSignal(p, MOON_CAMPAIGN, 'apollo-11-eagle')).toBe('apollo-14-antares')
    p = recordResult(p, 'moon', 'surveyor-3', caught)
    expect(nextSignal(p, MOON_CAMPAIGN, 'surveyor-3')).toBe('apollo-12-intrepid')
    for (const a of [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]) p = recordResult(p, 'moon', a.artifactId, caught)
    expect(nextSignal(p, MOON_CAMPAIGN, 'surveyor-3')).toBeNull()
  })
})
