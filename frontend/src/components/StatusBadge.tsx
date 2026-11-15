import { STATUS_LABELS, type ArtifactStatus } from '../types/artifact'

/** Status is shown by colour, an icon shape AND a word, so it never relies on colour alone. */
const STYLES: Record<ArtifactStatus, { color: string; icon: string }> = {
  operational: { color: 'var(--color-status-operational)', icon: '●' },
  inactive: { color: 'var(--color-status-inactive)', icon: '○' },
  decommissioned: { color: 'var(--color-status-decommissioned)', icon: '◆' },
  'lost-contact': { color: 'var(--color-status-lost)', icon: '◌' },
  unknown: { color: 'var(--color-status-unknown)', icon: '?' },
}

export default function StatusBadge({ status, className = '' }: { status: ArtifactStatus; className?: string }) {
  const s = STYLES[status]
  return (
    <span className={`label inline-flex items-center gap-1.5 ${className}`} style={{ '--c': s.color } as React.CSSProperties}>
      <span aria-hidden="true">{s.icon}</span>
      {STATUS_LABELS[status]}
    </span>
  )
}
