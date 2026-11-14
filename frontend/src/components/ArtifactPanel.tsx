import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAstro } from '../context/AstroContext'
import { formatDate } from '../data'
import { HARDWARE_LABELS, type Artifact } from '../types/artifact'
import ArtifactImage from './ArtifactImage'
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
        <div key={k} className="rounded-2xl bg-white/5 p-3">
          <dt className="text-sm font-semibold text-muted">{k}</dt>
          <dd className="text-ink">{v}</dd>
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
          <button type="button" aria-label="Close panel" className="absolute inset-0 bg-space-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="artifact-panel-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="glass-strong relative h-full w-full max-w-xl overflow-y-auto rounded-none rounded-l-3xl p-5 sm:p-7"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{artifact.missionName}</p>
                <h2 id="artifact-panel-title" className="text-3xl font-bold">
                  {artifact.name}
                </h2>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="btn btn-ghost min-h-11! px-4!">
                <span aria-hidden="true">✕</span>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <ArtifactImage artifact={artifact} showCredit className="aspect-video" />

            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={artifact.status} />
                {artifact.agency !== 'NASA' && <span className="chip border-amber/40 text-amber">{artifact.agency}</span>}
              </div>
              <p className="text-muted">{artifact.statusNote}</p>
              <p className="text-lg leading-relaxed">{artifact.story[0]}</p>
              <KeyFacts artifact={artifact} />

              <section>
                <h3 className="mb-2 text-xl font-semibold">What it discovered</h3>
                <ul className="space-y-2">
                  {artifact.discoveries.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span aria-hidden="true">💡</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link to={`/artifact/${artifact.id}`} className="btn btn-primary flex-1" onClick={onClose}>
                  Read the full story
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => openAstro(`Tell me about ${artifact.name} in simple words.`)}
                >
                  Ask Astro about it
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
