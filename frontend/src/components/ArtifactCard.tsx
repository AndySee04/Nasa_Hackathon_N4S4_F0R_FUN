import { motion } from 'framer-motion'
import { formatDate } from '../data'
import { HARDWARE_LABELS, type Artifact } from '../types/artifact'
import ArtifactImage from './ArtifactImage'
import StatusBadge from './StatusBadge'

interface Props {
  artifact: Artifact
  onSelect: (a: Artifact) => void
  index?: number
}

export default function ArtifactCard({ artifact, onSelect, index = 0 }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.06 }}
      className="glass group flex flex-col overflow-hidden p-3 transition hover:border-cyan/40 hover:bg-white/[0.09]"
    >
      <ArtifactImage artifact={artifact} />
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={artifact.status} />
          <span className="chip border-white/15 text-muted">{HARDWARE_LABELS[artifact.hardwareType]}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold leading-snug">{artifact.name}</h3>
          <p className="text-sm text-muted">
            {artifact.missionName} · launched {formatDate(artifact.launchDate)}
          </p>
        </div>
        <p className="flex-1 text-ink/90">{artifact.tagline}</p>
        <button type="button" className="btn btn-ghost w-full group-hover:border-cyan/50" onClick={() => onSelect(artifact)}>
          Open its story <span className="sr-only">: {artifact.name}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </motion.article>
  )
}
