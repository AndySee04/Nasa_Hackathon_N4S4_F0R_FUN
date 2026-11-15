import { motion } from 'framer-motion'
import { formatDate } from '../data'
import { WORLD_COLOR } from '../data/labels'
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

export default function ArtifactCard({ artifact, onSelect, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', damping: 16, stiffness: 140, delay: Math.min(index, 6) * 0.06 }}
      className="h-full"
    >
      <Paper as="article" tilt={TILTS[index % TILTS.length]} className="h-full" innerClassName="flex h-full flex-col p-4 pb-6">
        <ArtifactImage artifact={artifact} tilt={index % 2 ? -1 : 1} />
        <h3 className="mt-4 text-[1.6rem]">{artifact.name}</h3>
        <p className="muted text-sm">
          {artifact.missionName} · launched {formatDate(artifact.launchDate)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={artifact.status} />
          <span className="label c-white border-2 border-dashed border-ink/25">{HARDWARE_LABELS[artifact.hardwareType]}</span>
        </div>
        <p className="mb-4 mt-3 flex-1">{artifact.tagline}</p>
        <div>
          <button type="button" className={`cbtn ${WORLD_COLOR[artifact.world]}`} onClick={() => onSelect(artifact)}>
            Open its story <span className="sr-only">: {artifact.name}</span>
          </button>
        </div>
      </Paper>
    </motion.div>
  )
}
