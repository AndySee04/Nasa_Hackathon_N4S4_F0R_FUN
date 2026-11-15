import type { Campaign } from '../types/campaign'
import type { Progress } from './progress'

/** The steps of one level, in order. `ready: false` steps are shown as "coming soon" and skipped. */
export const LEVEL_STEPS = [
  { id: 'catch', label: 'Catch', ready: true },
  { id: 'discovery', label: 'Mission card', ready: true },
  { id: 'repair', label: 'Repair', ready: true },
  { id: 'science', label: 'Real story', ready: true },
  { id: 'quiz', label: 'Quiz', ready: true },
  { id: 'complete', label: 'Done', ready: true },
] as const

export type LevelStep = (typeof LEVEL_STEPS)[number]['id']

/** The next playable step after `step`, skipping steps that aren't built yet. */
export function nextStep(step: LevelStep): LevelStep {
  const i = LEVEL_STEPS.findIndex((s) => s.id === step)
  const next = LEVEL_STEPS.slice(i + 1).find((s) => s.ready)
  return next?.id ?? 'complete'
}

/** The next core signal the child hasn't caught yet (then the bonus), or null when all are found. */
export function nextSignal(progress: Progress, campaign: Campaign, currentId: string): string | null {
  const saved = progress.campaigns[campaign.id]?.artifacts ?? {}
  const order = [...campaign.artifacts, ...campaign.bonusArtifacts].map((a) => a.artifactId)
  const start = order.indexOf(currentId)
  const rotated = [...order.slice(start + 1), ...order.slice(0, Math.max(start, 0))]
  return rotated.find((id) => (saved[id]?.stars ?? 0) === 0) ?? null
}
