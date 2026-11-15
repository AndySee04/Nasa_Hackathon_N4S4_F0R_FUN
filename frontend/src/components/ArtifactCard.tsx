import { motion } from 'framer-motion'
import { formatDate } from '../data'
import { HARDWARE_LABELS, type Artifact } from '../types/artifact'
import ArtifactImage from './ArtifactImage'
import Paper from './Paper'
import StatusBadge from './StatusBadge'

interface Props {
  artifact: Artifact
  onSelect: (a: Artifact) => void
  index?: number
}

/** Cards sit at small, varied angles, like pieces glued on by hand. */
const TILTS = [-1.2, 0.8, -0.6, 1, -0.9, 0.5]

/**
 * One machine. The whole card opens its story (the name's button stretches over it).
 * Phones: a short row with a small photo on the left. Wider screens: a card with the photo on top.
 */
export default function ArtifactCard({ artifact, onSelect, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', damping: 16, stiffness: 140, delay: Math.min(index, 6) * 0.06 }}
      className="h-full"
    >
      <Paper
        as="article"
        tilt={TILTS[index % TILTS.length] * 0.6}
        className="h-full transition-[translate] duration-200 hover:-translate-y-1"
        innerClassName="relative grid h-full grid-cols-[6.5rem_1fr] items-start gap-x-3.5 p-3 pr-8 sm:flex sm:flex-col sm:items-stretch sm:p-4 sm:pb-5"
      >
        <ArtifactImage artifact={artifact} className="aspect-square sm:aspect-[4/3]" tilt={index % 2 ? -1 : 1} />
        <div className="flex min-w-0 flex-1 flex-col sm:mt-3">
          <h3 className="text-lg leading-tight sm:text-[1.35rem]">
            <button
              type="button"
              onClick={() => onSelect(artifact)}
              className="text-left after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:outline-dashed focus-visible:after:outline-3 focus-visible:after:-outline-offset-4 focus-visible:after:outline-ink"
            >
              {artifact.name}
              <span className="sr-only">. Open its story</span>
            </button>
          </h3>
          <p className="muted mt-0.5 text-sm">
            {artifact.missionName} · {formatDate(artifact.launchDate)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={artifact.status} />
            <span className="label c-white hidden border-2 border-dashed border-ink/25 sm:inline-flex">{HARDWARE_LABELS[artifact.hardwareType]}</span>
          </div>
          <p className="mt-2 leading-snug sm:flex-1">{artifact.tagline}</p>
          <span
            aria-hidden="true"
            className="font-display mt-3 hidden self-start text-sm text-ink/70 underline decoration-dashed underline-offset-4 sm:block"
          >
            Open its story
          </span>
        </div>
        {/* Phones: a crayon chevron says "tap me" without taking a line. */}
        <span aria-hidden="true" className="font-display absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-ink/50 sm:hidden">
          ›
        </span>
      </Paper>
    </motion.div>
  )
}
