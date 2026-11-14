import { STATUS_LABELS, type ArtifactStatus } from '../types/artifact'

/** Status is shown by colour, an icon shape AND a word, so it never relies on colour alone. */
const STYLES: Record<ArtifactStatus, { cls: string; icon: string }> = {
  operational: { cls: 'border-status-operational/50 bg-status-operational/15 text-status-operational', icon: '●' },
  inactive: { cls: 'border-status-inactive/50 bg-status-inactive/15 text-status-inactive', icon: '○' },
  decommissioned: { cls: 'border-status-decommissioned/50 bg-status-decommissioned/15 text-status-decommissioned', icon: '◆' },
  'lost-contact': { cls: 'border-status-lost/50 bg-status-lost/15 text-status-lost', icon: '◌' },
  unknown: { cls: 'border-status-unknown/50 bg-status-unknown/15 text-status-unknown', icon: '?' },
}

export default function StatusBadge({ status, className = '' }: { status: ArtifactStatus; className?: string }) {
  const s = STYLES[status]
  return (
    <span className={`chip ${s.cls} ${className}`}>
      <span aria-hidden="true">{s.icon}</span>
      {STATUS_LABELS[status]}
    </span>
  )
}
