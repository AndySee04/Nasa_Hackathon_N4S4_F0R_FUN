import type { ArtifactStatus, TimelineKind } from '../types/artifact'

/** Plain-language explanations of each status, shown next to the badges. */
export const STATUS_HELP: Record<ArtifactStatus, string> = {
  operational: 'Still working and sending data to Earth.',
  inactive: 'Left in place after its mission. No longer working.',
  decommissioned: 'Its mission was ended on purpose by the team.',
  'lost-contact': 'Stopped answering Earth, and the mission was ended.',
  unknown: 'We do not have reliable information about its current state.',
}

/** Icon, label and colour for each kind of timeline event. */
export const KIND_META: Record<TimelineKind, { icon: string; label: string; color: string }> = {
  launch: { icon: '🚀', label: 'Launch', color: 'bg-cyan' },
  journey: { icon: '🛰️', label: 'Journey', color: 'bg-sky-400' },
  arrival: { icon: '📍', label: 'Arrival', color: 'bg-violet' },
  operations: { icon: '🔧', label: 'Science operations', color: 'bg-indigo-400' },
  discovery: { icon: '💡', label: 'Discovery', color: 'bg-amber' },
  end: { icon: '🌙', label: 'Mission end', color: 'bg-status-lost' },
  status: { icon: '📡', label: 'Status update', color: 'bg-status-inactive' },
}
