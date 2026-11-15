import { useCallback, useId, useMemo, useState, type ReactNode } from 'react'
import { artifactsByWorld } from '../data'
import { STATUS_HELP } from '../data/labels'
import { usePageContext } from '../hooks/usePageContext'
import { STATUS_LABELS, type Artifact, type ArtifactStatus, type World } from '../types/artifact'
import ArtifactCard from './ArtifactCard'
import ArtifactPanel from './ArtifactPanel'
import Paper from './Paper'
import StatusBadge from './StatusBadge'

interface Props {
  world: World
  /** The module this page belongs to, shown on the tape above the title. */
  eyebrow: string
  title: string
  intro: ReactNode
  /** A button next to the intro, such as the world's mission game. */
  action?: ReactNode
}

/**
 * One world's machines. The header is a single strip and the filters a single row, so the machines start
 * near the top of the screen; on phones each machine is a short row, so all of them fit in a couple of swipes.
 */
export default function ArchivePage({ world, eyebrow, title, intro, action }: Props) {
  usePageContext(`${world}-archive`)
  const items = useMemo(() => artifactsByWorld(world), [world])
  const [filter, setFilter] = useState<ArtifactStatus | 'all'>('all')
  const [selected, setSelected] = useState<Artifact | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const helpId = useId()
  const close = useCallback(() => setSelected(null), [])

  const statuses = Array.from(new Set(items.map((a) => a.status)))
  const shown = filter === 'all' ? items : items.filter((a) => a.status === filter)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <Paper tilt={-0.5} innerClassName="flex flex-col gap-3 px-5 py-4 sm:px-7 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="min-w-0">
          <p className="tape -ml-1 mb-2">{eyebrow}</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 max-w-3xl leading-snug">{intro}</p>
          {/* What to do gets its own line, so it isn't lost at the end of the fact. */}
          <p className="mt-1.5 font-display">
            <span aria-hidden="true">👇 </span>Tap any machine to hear its story.
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </Paper>

      <div className="mb-4 mt-4 flex items-center gap-3 sm:mb-6 sm:mt-6">
        <div role="group" aria-label="Filter by status" className="chip-row -my-1 flex min-w-0 items-center gap-2.5 overflow-x-auto py-1 pr-6">
          <span className="font-display shrink-0 text-dusk">Show:</span>
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
            className="chip sticker c-paper shrink-0 whitespace-nowrap"
          >
            All ({items.length})
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className="chip sticker c-paper shrink-0 whitespace-nowrap"
            >
              {STATUS_LABELS[s]} ({items.filter((a) => a.status === s).length})
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-expanded={showHelp}
          aria-controls={helpId}
          onClick={() => setShowHelp((v) => !v)}
          className="sticker c-mint btn btn-sm ml-auto h-11 w-11 shrink-0 p-0! sm:w-auto sm:px-4!"
        >
          <span aria-hidden="true" className="sm:hidden">
            ?
          </span>
          <span className="sr-only sm:not-sr-only">What do these mean?</span>
        </button>
      </div>

      {showHelp && (
        <Paper id={helpId} tone="mint" tilt={0.4} className="mb-7" innerClassName="px-5 py-3">
          <ul className="space-y-2">
            {statuses.map((s) => (
              <li key={s} className="flex flex-wrap items-center gap-2">
                <StatusBadge status={s} /> {STATUS_HELP[s]}
              </li>
            ))}
          </ul>
        </Paper>
      )}

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
        {shown.map((a, i) => (
          <ArtifactCard key={a.id} artifact={a} onSelect={setSelected} index={i} />
        ))}
      </div>

      <ArtifactPanel artifact={selected} onClose={close} />
    </div>
  )
}
