import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { formatDate } from '../../data'
import { AGENCY_NOTE } from '../../data/campaigns/missionCardText'
import { HARDWARE_LABELS, type Artifact } from '../../types/artifact'
import ArtifactImage from '../ArtifactImage'
import Paper from '../Paper'
import StatusBadge from '../StatusBadge'

/** Stage 3: the scanner prints a mission card. Every fact comes from the artifact's NASA-sourced record. */
export default function MissionCard({
  artifact,
  onNext,
  nextLabel = 'Start the repair mission 🔧',
}: {
  artifact: Artifact
  onNext: () => void
  nextLabel?: string
}) {
  const still = useReducedMotion()
  const reveal = (i: number) =>
    still ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + i * 0.12 } }

  return (
    <Paper tilt={-0.5} innerClassName="p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tape c-mint mb-2">Mission card · scanned</p>
          <h2 className="text-3xl sm:text-4xl">{artifact.name}</h2>
          <p className="muted text-lg">{artifact.tagline}</p>
        </div>
        <StatusBadge status={artifact.status} className="mt-2" />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <motion.div {...reveal(0)}>
          <ArtifactImage artifact={artifact} showCredit tilt={-1.5} />
        </motion.div>

        <motion.dl {...reveal(1)} className="grid grid-cols-2 gap-3 self-start">
          <Fact label="Mission">{artifact.missionName}</Fact>
          <Fact label="Built by">
            {artifact.agency}
            {AGENCY_NOTE[artifact.agency] && <span className="muted block text-sm">{AGENCY_NOTE[artifact.agency]}</span>}
          </Fact>
          <Fact label="Launched">{formatDate(artifact.launchDate)}</Fact>
          <Fact label="Landed">{formatDate(artifact.arrivalDate)}</Fact>
          <Fact label="Type">{HARDWARE_LABELS[artifact.hardwareType]}</Fact>
          <Fact label="Where">{artifact.location.description}</Fact>
        </motion.dl>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <motion.section {...reveal(2)} className="inset p-4">
          <h3 className="text-xl">🎯 Its job</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {artifact.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </motion.section>
        <motion.section {...reveal(3)} className="inset p-4">
          <h3 className="text-xl">🔧 Its tools</h3>
          <ul className="mt-2 space-y-2">
            {artifact.instruments.map((i) => (
              <li key={i.name}>
                <strong>{i.name}</strong>: {i.purpose}
              </li>
            ))}
          </ul>
        </motion.section>
        <motion.section {...reveal(4)} className="inset p-4">
          <h3 className="text-xl">📍 Where it is now</h3>
          <p className="mt-2">{artifact.statusNote}</p>
        </motion.section>
      </div>

      <motion.p {...reveal(5)} className="mt-5 text-lg">
        <span className="label c-yellow">Fun fact</span> {artifact.funFact}
      </motion.p>

      <div className="mt-6">
        <Sources artifact={artifact} />
      </div>
      <div className="next-dock mt-4">
        <button type="button" className="cbtn c-yellow" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </Paper>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md bg-sticker/80 px-3 py-2 shadow-[0_2px_0_rgba(34,32,58,0.12)]">
      <dt className="font-display text-sm text-ink-soft">{label}</dt>
      <dd className="m-0 font-bold">{children}</dd>
    </div>
  )
}

export function Sources({ artifact }: { artifact: Artifact }) {
  return (
    <details className="muted text-sm">
      <summary className="cursor-pointer font-display">
        Where do these facts come from?{artifact.lastVerified ? ` (checked ${formatDate(artifact.lastVerified)})` : ''}
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {artifact.sources.map((s) => (
          <li key={s.url}>
            <a className="link" href={s.url} target="_blank" rel="noreferrer">
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
