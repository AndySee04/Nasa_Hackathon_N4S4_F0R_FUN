import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { artifactsByWorld } from '../data'
import { usePageContext } from '../hooks/usePageContext'
import { STATUS_LABELS, type Artifact, type ArtifactStatus, type World } from '../types/artifact'
import ArtifactCard from './ArtifactCard'
import ArtifactPanel from './ArtifactPanel'
import PageHeader from './PageHeader'
import { STATUS_HELP } from '../data/labels'
import StatusBadge from './StatusBadge'

interface Props {
  world: World
  eyebrow: string
  title: string
  intro: ReactNode
}

export default function ArchivePage({ world, eyebrow, title, intro }: Props) {
  usePageContext(`${world}-archive`)
  const items = useMemo(() => artifactsByWorld(world), [world])
  const [filter, setFilter] = useState<ArtifactStatus | 'all'>('all')
  const [selected, setSelected] = useState<Artifact | null>(null)
  const close = useCallback(() => setSelected(null), [])

  const statuses = Array.from(new Set(items.map((a) => a.status)))
  const shown = filter === 'all' ? items : items.filter((a) => a.status === filter)

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title}>
        {intro}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass mb-8 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`chip min-h-10 ${filter === 'all' ? 'border-cyan bg-cyan/20 text-ink' : 'border-white/15 text-muted hover:text-ink'}`}
            >
              All ({items.length})
            </button>
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
                className={`chip min-h-10 ${filter === s ? 'border-cyan bg-cyan/20 text-ink' : 'border-white/15 text-muted hover:text-ink'}`}
              >
                {STATUS_LABELS[s]} ({items.filter((a) => a.status === s).length})
              </button>
            ))}
          </div>
          <details className="text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-ink">What do the statuses mean?</summary>
            <ul className="mt-3 space-y-2">
              {statuses.map((s) => (
                <li key={s} className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={s} /> {STATUS_HELP[s]}
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a, i) => (
            <ArtifactCard key={a.id} artifact={a} onSelect={setSelected} index={i} />
          ))}
        </div>
      </div>

      <ArtifactPanel artifact={selected} onClose={close} />
    </>
  )
}
