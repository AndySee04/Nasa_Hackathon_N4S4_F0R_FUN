import { motion, useReducedMotion } from 'framer-motion'
import type { Artifact } from '../../types/artifact'
import Paper from '../Paper'
import { Sources } from './MissionCard'

/**
 * Stage 5: what really happened. Kept visibly separate from anything pretend
 * (the training-simulator challenges), so children always know which parts are true.
 */
export default function RealStoryCard({ level, artifact, onNext }: { level: { science: { headline: string; points: string[] } }; artifact: Artifact; onNext: () => void }) {
  const still = useReducedMotion()
  return (
    <Paper tone="sky" tilt={0.6} innerClassName="p-5 sm:p-8">
      <p className="tape c-white mb-3">✅ Real story · true facts from NASA records</p>
      <h2 className="text-3xl">{level.science.headline}</h2>
      <ol className="mt-5 space-y-3">
        {level.science.points.map((point, i) => (
          <motion.li
            key={point}
            className="flex gap-3 rounded-md bg-sticker/85 p-3 text-lg"
            initial={still ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: still ? 0 : 0.2 + i * 0.25 }}
          >
            <span className="font-display text-2xl text-ink-soft" aria-hidden="true">
              {i + 1}
            </span>
            <span>{point}</span>
          </motion.li>
        ))}
      </ol>
      <p className="mt-5 text-lg">
        <strong>Today:</strong> {artifact.statusNote}
      </p>
      <div className="mt-6">
        <Sources artifact={artifact} />
      </div>
      <div className="next-dock mt-4">
        <button type="button" className="cbtn c-yellow" onClick={onNext}>
          Quiz time →
        </button>
      </div>
    </Paper>
  )
}
