import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RocketCatcher from '../components/game/RocketCatcher'
import { MachineSprite } from '../components/game/Sprites'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import StatusBadge from '../components/StatusBadge'
import { artifactById, formatDate } from '../data'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { awardBadge, recordResult } from '../game/progress'
import { useProgress } from '../game/useProgress'
import { usePageContext } from '../hooks/usePageContext'

const LEVELS = [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]

/** One Moon level. G3 covers Stage 2 (catch) and the reveal; repair, real story and quiz follow in G4–G5. */
export default function MoonLevel() {
  const { artifactId = '' } = useParams()
  const level = LEVELS.find((l) => l.artifactId === artifactId)
  const artifact = level ? artifactById(level.artifactId) : undefined
  usePageContext('moon-campaign', artifact?.id)
  const { progress, update } = useProgress()
  const [caught, setCaught] = useState(false)
  // A new key restarts the catcher (and its layout) for "Play again".
  const [round, setRound] = useState(0)

  if (!level || !artifact) {
    return (
      <PageHeader eyebrow="Moon campaign" title="Signal lost!">
        We couldn&apos;t find that signal.{' '}
        <Link to="/moon/campaign" className="link">
          Back to the Moon
        </Link>
      </PageHeader>
    )
  }

  const easy = progress.settings.easyMode
  const saved = progress.campaigns[MOON_CAMPAIGN.id]?.artifacts[artifact.id]
  const isBonus = MOON_CAMPAIGN.bonusArtifacts.some((b) => b.artifactId === artifact.id)

  function handleCaught() {
    update((p) => awardBadge(recordResult(p, MOON_CAMPAIGN.id, artifact!.id, { caught: true, repaired: false, quizCorrect: 0 }), MOON_CAMPAIGN))
    setCaught(true)
  }

  return (
    <>
      <PageHeader eyebrow={`Moon campaign · ${isBonus ? 'Bonus signal' : 'Signal'}`} title={caught ? 'Signal identified!' : 'Catch the signal!'}>
        {caught ? 'Your rocket claw brought it up for a closer look.' : `The signal is coming from ${artifact.location.description}.`}
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {!caught ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <Link to="/moon/campaign" className="link text-chalk">
                ← Back to the Moon
              </Link>
              <button
                type="button"
                className="chip sticker c-white"
                aria-pressed={easy}
                onClick={() => update((p) => ({ ...p, settings: { ...p.settings, easyMode: !p.settings.easyMode } }))}
              >
                {easy ? '🐣 Easy mode: on' : '🦅 Easy mode: off'}
              </button>
            </div>
            <RocketCatcher key={round} attempt={round} artifactId={artifact.id} sprite={level.catcherSprite} easy={easy} onCaught={handleCaught} />
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 14 }}>
            <Paper tilt={-0.8} innerClassName="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="mx-auto w-40 shrink-0 sm:w-48">
                <MachineSprite kind={level.catcherSprite} className="w-full" />
              </div>
              <div>
                <p className="tape c-mint mb-3">You caught it!</p>
                <h2 className="text-3xl">{artifact.name}</h2>
                <p className="muted">
                  {artifact.missionName} · landed {formatDate(artifact.arrivalDate)}
                </p>
                <div className="mt-2">
                  <StatusBadge status={artifact.status} />
                </div>
                <p className="mt-3 text-lg">{artifact.tagline}</p>
                <p className="mt-3 font-display" aria-label={`${saved?.stars ?? 1} of 3 stars`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} aria-hidden="true" className={`text-2xl ${i < (saved?.stars ?? 1) ? '' : 'opacity-25 grayscale'}`}>
                      ⭐
                    </span>
                  ))}{' '}
                  Catch star earned!
                </p>
                <p className="muted mt-1 text-sm">The repair mission and quiz for the other two stars arrive in the next update.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/moon/campaign" className="cbtn c-yellow">
                    Back to the Moon 🌕
                  </Link>
                  <Link to={`/artifact/${artifact.id}`} className="cbtn c-sky">
                    Read its full story
                  </Link>
                  <button
                    type="button"
                    className="chip sticker c-white"
                    onClick={() => {
                      setCaught(false)
                      setRound((r) => r + 1)
                    }}
                  >
                    Play again
                  </button>
                </div>
              </div>
            </Paper>
          </motion.div>
        )}
      </div>
    </>
  )
}
