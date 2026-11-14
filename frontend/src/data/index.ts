import type { Artifact, World } from '../types/artifact'
import raw from './artifacts.json'

export const artifacts = raw as Artifact[]

export const artifactById = (id: string | undefined): Artifact | undefined =>
  artifacts.find((a) => a.id === id)

export const artifactsByWorld = (world: World): Artifact[] =>
  artifacts.filter((a) => a.world === world)

/** Decade label used by the timeline's "mission era" filter. */
export const eraOf = (a: Artifact): string => `${a.launchDate.slice(0, 3)}0s`

export const ERAS = Array.from(new Set(artifacts.map(eraOf))).sort()

/** Formats YYYY-MM-DD or YYYY-MM dates for display, without timezone surprises. */
export function formatDate(date: string | undefined): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (!m) return String(y)
  if (!d) return `${months[m - 1]} ${y}`
  return `${d} ${months[m - 1]} ${y}`
}

export const FEATURED_IDS = ['apollo-11-eagle', 'opportunity', 'voyager-1']
