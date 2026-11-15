import { describe, expect, it } from 'vitest'
import { emptyProgress, mergeProgress, recordResult, sameStars, type Progress } from './progress'

const perfect = { caught: true, repaired: true, quizCorrect: 3 }
const caughtOnly = { caught: true, repaired: false, quizCorrect: 0 }
const repairedOnly = { caught: true, repaired: true, quizCorrect: 1 }

const withBadge = (p: Progress, campaign: string, badge: string): Progress => ({
  ...p,
  campaigns: { ...p.campaigns, [campaign]: { ...p.campaigns[campaign], badges: [...(p.campaigns[campaign]?.badges ?? []), badge] } },
})

describe('merging this browser with the account', () => {
  it('keeps machines found on either side', () => {
    const browser = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', caughtOnly)
    const account = recordResult(emptyProgress(), 'mars', 'viking-1-lander', caughtOnly)
    const merged = mergeProgress(browser, account)
    expect(merged.campaigns.moon.artifacts['apollo-11-eagle'].stars).toBe(1)
    expect(merged.campaigns.mars.artifacts['viking-1-lander']).toBeDefined()
  })

  it('never lowers stars: takes the best result for each machine', () => {
    const browser = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', caughtOnly)
    const account = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', perfect)
    expect(mergeProgress(browser, account).campaigns.moon.artifacts['apollo-11-eagle'].stars).toBe(3)
    expect(mergeProgress(account, browser).campaigns.moon.artifacts['apollo-11-eagle'].stars).toBe(3)
  })

  it('combines the best parts of two partial results', () => {
    const browser = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', repairedOnly)
    const account = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', { caught: true, repaired: false, quizCorrect: 3 })
    const merged = mergeProgress(browser, account).campaigns.moon.artifacts['apollo-11-eagle']
    expect(merged.best).toEqual(perfect)
    expect(merged.stars).toBe(3)
  })

  it('keeps every badge and the most plays', () => {
    let browser = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', caughtOnly)
    browser = recordResult(browser, 'moon', 'apollo-11-eagle', caughtOnly)
    const account = withBadge(recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', caughtOnly), 'moon', 'moon-explorer')
    const merged = mergeProgress(browser, account)
    expect(merged.campaigns.moon.badges).toEqual(['moon-explorer'])
    expect(merged.campaigns.moon.artifacts['apollo-11-eagle'].plays).toBe(2)
  })

  it("keeps this browser's settings", () => {
    const browser = { ...emptyProgress(), settings: { ...emptyProgress().settings, easyMode: false } }
    const account = { ...emptyProgress(), settings: { ...emptyProgress().settings, easyMode: true } }
    expect(mergeProgress(browser, account).settings.easyMode).toBe(false)
  })

  it('merging with an empty save changes nothing', () => {
    const browser = withBadge(recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', perfect), 'moon', 'moon-explorer')
    expect(sameStars(mergeProgress(browser, emptyProgress()), browser)).toBe(true)
    expect(sameStars(mergeProgress(emptyProgress(), browser), browser)).toBe(true)
  })
})

describe('comparing saves', () => {
  it('ignores settings and the order things were saved in', () => {
    const a = recordResult(recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', perfect), 'mars', 'viking-1-lander', caughtOnly)
    const b = recordResult(recordResult(emptyProgress(), 'mars', 'viking-1-lander', caughtOnly), 'moon', 'apollo-11-eagle', perfect)
    expect(sameStars(a, { ...b, settings: { ...b.settings, easyMode: !b.settings.easyMode } })).toBe(true)
  })

  it('notices a new star', () => {
    const a = recordResult(emptyProgress(), 'moon', 'apollo-11-eagle', caughtOnly)
    const b = recordResult(a, 'moon', 'apollo-11-eagle', perfect)
    expect(sameStars(a, b)).toBe(false)
  })
})
