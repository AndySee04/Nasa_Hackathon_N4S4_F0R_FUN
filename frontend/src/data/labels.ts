import type { ArtifactStatus, TimelineKind, World } from '../types/artifact'

/** Crayon colour for each world (a c-* class from index.css), used on buttons and labels. */
export const WORLD_COLOR: Record<World, string> = { moon: 'c-yellow', mars: 'c-orange', 'deep-space': 'c-mint' }

/** Plain-language explanations of each status, shown next to the badges. */
export const STATUS_HELP: Record<ArtifactStatus, string> = {
  operational: 'Still working and sending data to Earth.',
  inactive: 'Left in place after its mission. No longer working.',
  decommissioned: 'Its mission was ended on purpose by the team.',
  'lost-contact': 'Stopped answering Earth, and the mission was ended.',
  unknown: 'We do not have reliable information about its current state.',
}

/** Icon, label and crayon colour (a c-* class) for each kind of timeline event. */
export const KIND_META: Record<TimelineKind, { icon: string; label: string; color: string }> = {
  launch: { icon: '🚀', label: 'Launch', color: 'c-sky' },
  journey: { icon: '🛰️', label: 'Journey', color: 'c-lilac' },
  arrival: { icon: '📍', label: 'Arrival', color: 'c-pink' },
  operations: { icon: '🔧', label: 'Science operations', color: 'c-mint' },
  discovery: { icon: '💡', label: 'Discovery', color: 'c-yellow' },
  end: { icon: '🌙', label: 'Mission end', color: 'c-orange' },
  status: { icon: '📡', label: 'Status update', color: 'c-paper' },
}
