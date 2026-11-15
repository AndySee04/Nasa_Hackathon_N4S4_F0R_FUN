import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { artifactsByWorld } from '../data'
import { STATUS_HELP } from '../data/labels'
import { usePageContext } from '../hooks/usePageContext'
import { STATUS_LABELS, type Artifact, type ArtifactStatus, type World } from '../types/artifact'
import ArtifactCard from './ArtifactCard'
import ArtifactPanel from './ArtifactPanel'
import PageHeader from './PageHeader'
import Paper from './Paper'
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
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-3">
            <span className="font-display text-dusk">Show:</span>
            <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')} className="chip sticker c-paper">
              All ({items.length})
            </button>
            {statuses.map((s) => (
              <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className="chip sticker c-paper">
                {STATUS_LABELS[s]} ({items.filter((a) => a.status === s).length})
              </button>
            ))}
          </div>
          <Paper tone="mint" tilt={1} className="lg:max-w-md" innerClassName="px-5 py-3">
            <details>
              <summary className="cursor-pointer font-display">What do the statuses mean?</summary>
              <ul className="mt-3 space-y-2 pb-1">
                {statuses.map((s) => (
                  <li key={s} className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={s} /> {STATUS_HELP[s]}
                  </li>
                ))}
              </ul>
            </details>
          </Paper>
        </div>

        <div className="grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a, i) => (
            <ArtifactCard key={a.id} artifact={a} onSelect={setSelected} index={i} />
          ))}
        </div>
      </div>

      <ArtifactPanel artifact={selected} onClose={close} />
    </>
  )
}
