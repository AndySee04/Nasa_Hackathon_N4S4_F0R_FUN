import { describe, expect, it } from 'vitest'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import {
  awardBadge,
  campaignStars,
  clearProgress,
  emptyProgress,
  isCampaignComplete,
  loadProgress,
  parseProgress,
  recordResult,
  saveProgress,
  STORAGE_KEY,
} from './progress'
import { bestOf, starsFor } from './scoring'

const perfect = { caught: true, repaired: true, quizCorrect: 3 }
const caughtOnly = { caught: true, repaired: false, quizCorrect: 1 }

class MemoryStorage {
  data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
}

describe('scoring', () => {
  it('gives one star each for catch, repair and quiz (2 of 3 to pass)', () => {
    expect(starsFor({ caught: false, repaired: false, quizCorrect: 0 })).toBe(0)
    expect(starsFor(caughtOnly)).toBe(1)
    expect(starsFor({ caught: true, repaired: false, quizCorrect: 2 })).toBe(2)
    expect(starsFor(perfect)).toBe(3)
  })

  it('keeps the best of two results', () => {
    expect(bestOf(perfect, caughtOnly)).toEqual(perfect)
    expect(bestOf({ caught: true, repaired: true, quizCorrect: 0 }, { caught: true, repaired: false, quizCorrect: 3 })).toEqual(perfect)
  })
})

describe('progress', () => {
  it('never lowers stars on a worse replay and counts plays', () => {
    let p = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', perfect)
    p = recordResult(p, 'moon', 'apollo-11-eagle', caughtOnly)
    expect(p.campaigns.moon.artifacts['apollo-11-eagle']).toMatchObject({ stars: 3, plays: 2 })
  })

  it('counts stars against 12 core and 15 with the bonus', () => {
    let p = emptyProgress()
    for (const a of [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]) p = recordResult(p, 'moon', a.artifactId, perfect)
    expect(campaignStars(p, MOON_CAMPAIGN)).toEqual({ earned: 15, max: 12, maxWithBonus: 15 })
  })

  it('awards the badge only when all four core artifacts are caught', () => {
    let p = emptyProgress()
    const [first, ...rest] = MOON_CAMPAIGN.artifacts
    p = recordResult(p, 'moon', first.artifactId, caughtOnly)
    expect(isCampaignComplete(p, MOON_CAMPAIGN)).toBe(false)
    expect(awardBadge(p, MOON_CAMPAIGN)).toBe(p)
    for (const a of rest) p = recordResult(p, 'moon', a.artifactId, caughtOnly)
    p = awardBadge(p, MOON_CAMPAIGN)
    expect(p.campaigns.moon.badges).toEqual(['moon-explorer'])
    expect(awardBadge(p, MOON_CAMPAIGN)).toBe(p)
  })

  it('round-trips through storage', () => {
    const store = new MemoryStorage()
    const p = recordResult(emptyProgress(), 'moon', 'surveyor-3', perfect)
    expect(saveProgress(p, store)).toBe(true)
    expect(loadProgress(store)).toEqual(p)
    clearProgress(store)
    expect(store.getItem(STORAGE_KEY)).toBeNull()
  })

  it('survives broken or tampered saves', () => {
    expect(parseProgress('not json')).toEqual(emptyProgress())
    expect(parseProgress('{"version": 99}')).toEqual(emptyProgress())
    const tampered = JSON.stringify({
      version: 1,
      settings: { easyMode: false, sound: 'loud' },
      campaigns: { moon: { artifacts: { x: { stars: 99, best: { caught: true, quizCorrect: 50 }, plays: -4 }, y: 'junk' }, badges: ['a', 'a', 3] } },
    })
    const p = parseProgress(tampered)
    expect(p.settings).toMatchObject({ easyMode: false, sound: false })
    expect(p.campaigns.moon.artifacts.x).toEqual({ stars: 2, best: { caught: true, repaired: false, quizCorrect: 3 }, plays: 1 })
    expect(p.campaigns.moon.artifacts.y).toBeUndefined()
    expect(p.campaigns.moon.badges).toEqual(['a'])
  })

  it('keeps working when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
    } as unknown as Storage
    expect(loadProgress(broken)).toEqual(emptyProgress())
    expect(saveProgress(emptyProgress(), broken)).toBe(false)
    expect(saveProgress(emptyProgress(), null)).toBe(false)
  })
})
