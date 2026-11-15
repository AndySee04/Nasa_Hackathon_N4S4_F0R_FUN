import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAstro } from '../hooks/useAstro'
import { formatDate } from '../data'
import { WORLD_COLOR } from '../data/labels'
import { HARDWARE_LABELS, type Artifact } from '../types/artifact'
import ArtifactImage from './ArtifactImage'
import Paper from './Paper'
import StatusBadge from './StatusBadge'

interface Props {
  artifact: Artifact | null
  onClose: () => void
}

export function KeyFacts({ artifact }: { artifact: Artifact }) {
  const facts: [string, string][] = [
    ['Mission', artifact.missionName],
    ['Built by', artifact.agency],
    ['Hardware type', HARDWARE_LABELS[artifact.hardwareType]],
    ['Launched', formatDate(artifact.launchDate)],
    [artifact.world === 'deep-space' ? 'Milestone reached' : 'Arrived / landed', formatDate(artifact.arrivalDate)],
    ['Last contact / end', artifact.endDate ? formatDate(artifact.endDate) : 'Still active'],
    [artifact.trajectory ? 'Where it is now' : 'Final location', artifact.trajectory ?? artifact.location.description],
  ]
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {facts.map(([k, v]) => (
        <div key={k} className="inset p-3">
          <dt className="muted font-display text-sm">{k}</dt>
          <dd className="m-0">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function ArtifactPanel({ artifact, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const { open: openAstro, setPageContext } = useAstro()

  useEffect(() => {
    if (!artifact) return
    setPageContext({ page: 'artifact-panel', artifactId: artifact.id })
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [artifact, onClose, setPageContext])

  return (
    <AnimatePresence>
      {artifact && (
        <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close panel" className="absolute inset-0 bg-night/75" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="artifact-panel-title"
            initial={{ x: '105%', rotate: 3 }}
            animate={{ x: 0, rotate: 0 }}
            exit={{ x: '105%', rotate: 3 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="relative h-full w-full max-w-xl py-3 pl-3 sm:py-4"
          >
            <Paper className="h-full" innerClassName="h-full overflow-y-auto px-5 pb-8 pt-5 sm:px-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="tape mb-2">{artifact.missionName}</p>
                  <h2 id="artifact-panel-title" className="text-3xl">
                    {artifact.name}
                  </h2>
                </div>
                <button ref={closeRef} type="button" onClick={onClose} className="sticker c-white btn btn-sm h-11 w-11 shrink-0 p-0!">
                  <span aria-hidden="true">✕</span>
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <ArtifactImage artifact={artifact} showCredit className="aspect-video" tilt={-1} />

              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={artifact.status} />
                  {artifact.agency !== 'NASA' && <span className="label c-sky">{artifact.agency}</span>}
                </div>
                <p className="muted">{artifact.statusNote}</p>
                <p className="text-lg leading-relaxed">{artifact.story[0]}</p>
                <KeyFacts artifact={artifact} />

                <section>
                  <h3 className="scribble mb-3 inline-block text-xl">What it discovered</h3>
                  <ul className="space-y-2">
                    {artifact.discoveries.map((d) => (
                      <li key={d} className="flex gap-3">
                        <span aria-hidden="true">💡</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                  <Link to={`/artifact/${artifact.id}`} className={`cbtn ${WORLD_COLOR[artifact.world]} flex-1`} onClick={onClose}>
                    Read the full story
                  </Link>
                  <button
                    type="button"
                    className="sticker c-white btn flex-1"
                    onClick={() => openAstro(`Tell me about ${artifact.name} in simple words.`)}
                  >
                    Ask Astro about it
                  </button>
                </div>
              </div>
            </Paper>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
