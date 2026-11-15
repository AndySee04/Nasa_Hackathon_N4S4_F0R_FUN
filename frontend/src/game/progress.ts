/**
 * Saved game progress. Lives in this browser's localStorage, and also in the grown-up's
 * account when one is signed in (see cloudProgress.ts). It holds stars and settings only:
 * no names. The certificate nickname is never saved.
 */
import { bestOf, quizPassFor, starsFor, type LevelResult, type Stars } from './scoring'

/** The parts of a campaign that progress needs. Moon and Mars both fit. */
export interface CampaignLike {
  id: string
  artifacts: { artifactId: string }[]
  bonusArtifacts: { artifactId: string }[]
  badge: { id: string }
  /** Stars needed on every core level for the badge. Moon: 1 (just find them). Mars: 3 (full stars). */
  badgeNeedsStars?: number
}

export const STORAGE_KEY = 'n4s4.progress.v1'

/** Fired on this window after progress is saved or cleared, so every open page and the account sync can follow. */
export const PROGRESS_EVENT = 'n4s4:progress'

function announce() {
  if (typeof window === 'undefined') return
  // Later, not during the save: saves happen inside React state updates, and listeners update state too.
  queueMicrotask(() => window.dispatchEvent(new Event(PROGRESS_EVENT)))
}

export interface ArtifactProgress {
  stars: Stars
  best: LevelResult
  plays: number
}

export interface CampaignProgress {
  artifacts: Record<string, ArtifactProgress>
  badges: string[]
}

export interface Settings {
  easyMode: boolean
  sound: boolean
  readAloud: boolean
  reduceMotion: boolean
}

export interface Progress {
  version: 1
  campaigns: Record<string, CampaignProgress>
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = { easyMode: true, sound: false, readAloud: false, reduceMotion: false }

export const emptyProgress = (): Progress => ({ version: 1, campaigns: {}, settings: { ...DEFAULT_SETTINGS } })

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function cleanResult(v: unknown): LevelResult | null {
  if (!isObject(v)) return null
  const quiz = Number(v.quizCorrect)
  if (!Number.isFinite(quiz)) return null
  return { caught: v.caught === true, repaired: v.repaired === true, quizCorrect: Math.min(10, Math.max(0, Math.floor(quiz))) }
}

/**
 * Reads saved progress defensively. Anything malformed is dropped rather than
 * crashing the game; stars are recomputed from the saved best result so a
 * hand-edited value can't exceed what was earned.
 */
export function parseProgress(raw: string | null): Progress {
  const out = emptyProgress()
  if (!raw) return out
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return out
  }
  if (!isObject(data) || data.version !== 1) return out
  if (isObject(data.settings)) {
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof data.settings[key] === 'boolean') out.settings[key] = data.settings[key]
    }
  }
  if (isObject(data.campaigns)) {
    for (const [cid, c] of Object.entries(data.campaigns)) {
      if (!isObject(c)) continue
      const artifacts: Record<string, ArtifactProgress> = {}
      if (isObject(c.artifacts)) {
        for (const [aid, a] of Object.entries(c.artifacts)) {
          if (!isObject(a)) continue
          const best = cleanResult(a.best)
          if (!best) continue
          const plays = Math.max(1, Math.floor(Number(a.plays) || 1))
          artifacts[aid] = { best, stars: starsFor(best, quizPassFor(cid)), plays }
        }
      }
      const badges = Array.isArray(c.badges) ? c.badges.filter((b): b is string => typeof b === 'string') : []
      out.campaigns[cid] = { artifacts, badges: [...new Set(badges)] }
    }
  }
  return out
}

/** localStorage can be missing or throw (private mode, blocked storage). */
function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadProgress(store: Storage | null = storage()): Progress {
  try {
    return parseProgress(store?.getItem(STORAGE_KEY) ?? null)
  } catch {
    return emptyProgress()
  }
}

/** Returns false if the browser refused to save; the game keeps working either way. */
export function saveProgress(p: Progress, store: Storage | null = storage()): boolean {
  try {
    if (!store) return false
    store.setItem(STORAGE_KEY, JSON.stringify(p))
    announce()
    return true
  } catch {
    return false
  }
}

export function clearProgress(store: Storage | null = storage()): void {
  try {
    store?.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to clear */
  }
  announce()
}

/**
 * Combines two saves of the same explorer (this browser and the account) without losing anything:
 * the best result for every machine, the most plays, and every badge. Settings come from `mine`.
 */
export function mergeProgress(mine: Progress, theirs: Progress): Progress {
  const out: Progress = { version: 1, campaigns: {}, settings: { ...mine.settings } }
  for (const cid of new Set([...Object.keys(mine.campaigns), ...Object.keys(theirs.campaigns)])) {
    const a = mine.campaigns[cid] ?? { artifacts: {}, badges: [] }
    const b = theirs.campaigns[cid] ?? { artifacts: {}, badges: [] }
    const artifacts: Record<string, ArtifactProgress> = {}
    for (const aid of new Set([...Object.keys(a.artifacts), ...Object.keys(b.artifacts)])) {
      const x = a.artifacts[aid]
      const y = b.artifacts[aid]
      const best = x && y ? bestOf(x.best, y.best) : (x ?? y)!.best
      artifacts[aid] = { best, stars: starsFor(best, quizPassFor(cid)), plays: Math.max(x?.plays ?? 0, y?.plays ?? 0) }
    }
    out.campaigns[cid] = { artifacts, badges: [...new Set([...a.badges, ...b.badges])] }
  }
  return out
}

/** True when two saves hold the same stars and badges (settings aside). */
export function sameStars(a: Progress, b: Progress): boolean {
  const key = (p: Progress) =>
    JSON.stringify(
      Object.keys(p.campaigns)
        .sort()
        .map((cid) => [
          cid,
          Object.keys(p.campaigns[cid].artifacts)
            .sort()
            .map((aid) => [aid, p.campaigns[cid].artifacts[aid]]),
          [...p.campaigns[cid].badges].sort(),
        ]),
    )
  return key(a) === key(b)
}

/** Records one finished level. Never lowers stars. Returns a new object. */
export function recordResult(p: Progress, campaignId: string, artifactId: string, result: LevelResult): Progress {
  const campaign = p.campaigns[campaignId] ?? { artifacts: {}, badges: [] }
  const prev = campaign.artifacts[artifactId]
  const best = prev ? bestOf(prev.best, result) : bestOf(result, result)
  return {
    ...p,
    campaigns: {
      ...p.campaigns,
      [campaignId]: {
        ...campaign,
        artifacts: { ...campaign.artifacts, [artifactId]: { best, stars: starsFor(best, quizPassFor(campaignId)), plays: (prev?.plays ?? 0) + 1 } },
      },
    },
  }
}

export function campaignStars(p: Progress, c: CampaignLike): { earned: number; max: number; maxWithBonus: number } {
  const saved = p.campaigns[c.id]?.artifacts ?? {}
  const all = [...c.artifacts, ...c.bonusArtifacts]
  const earned = all.reduce((sum, a) => sum + (saved[a.artifactId]?.stars ?? 0), 0)
  return { earned, max: c.artifacts.length * 3, maxWithBonus: all.length * 3 }
}

/** The badge needs every core artifact found (Moon) or fully starred (Mars). */
export function isCampaignComplete(p: Progress, c: CampaignLike): boolean {
  const saved = p.campaigns[c.id]?.artifacts ?? {}
  const need = c.badgeNeedsStars ?? 1
  return c.artifacts.every((a) => (saved[a.artifactId]?.stars ?? 0) >= need)
}

/** Adds the campaign badge if it has been earned. Returns the same object if nothing changed. */
export function awardBadge(p: Progress, c: CampaignLike): Progress {
  const campaign = p.campaigns[c.id]
  if (!campaign || campaign.badges.includes(c.badge.id) || !isCampaignComplete(p, c)) return p
  return { ...p, campaigns: { ...p.campaigns, [c.id]: { ...campaign, badges: [...campaign.badges, c.badge.id] } } }
}
