import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MissionCard from '../components/game/MissionCard'
import RealStoryCard from '../components/game/RealStoryCard'
import RocketCatcher from '../components/game/RocketCatcher'
import { MachineSprite } from '../components/game/Sprites'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import { artifactById } from '../data'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { LEVEL_STEPS, nextSignal, nextStep, type LevelStep } from '../game/levelFlow'
import { awardBadge, campaignStars, recordResult } from '../game/progress'
import { useProgress } from '../game/useProgress'
import { usePageContext } from '../hooks/usePageContext'

const LEVELS = [...MOON_CAMPAIGN.artifacts, ...MOON_CAMPAIGN.bonusArtifacts]

/** One Moon level: catch → mission card → (repair) → real story → (quiz) → done. Steps in brackets arrive in G5. */
export default function MoonLevel() {
  const { artifactId = '' } = useParams()
  const level = LEVELS.find((l) => l.artifactId === artifactId)
  const artifact = level ? artifactById(level.artifactId) : undefined
  usePageContext('moon-campaign', artifact?.id)
  const { progress, update } = useProgress()
  const [step, setStep] = useState<LevelStep>('catch')
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
  const go = (to: LevelStep) => {
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const next = nextSignal(progress, MOON_CAMPAIGN, artifact.id)
  const nextArtifact = next ? artifactById(next) : undefined
  const totals = campaignStars(progress, MOON_CAMPAIGN)
  const hasBadge = progress.campaigns[MOON_CAMPAIGN.id]?.badges.includes(MOON_CAMPAIGN.badge.id) ?? false
  const isBonus = MOON_CAMPAIGN.bonusArtifacts.some((b) => b.artifactId === artifact.id)

  function handleCaught() {
    update((p) => awardBadge(recordResult(p, MOON_CAMPAIGN.id, artifact!.id, { caught: true, repaired: false, quizCorrect: 0 }), MOON_CAMPAIGN))
    setStep('discovery')
  }

  const titles: Record<LevelStep, string> = {
    catch: 'Catch the signal!',
    discovery: 'Signal identified!',
    repair: 'Repair mission',
    science: 'The real story',
    quiz: 'Quiz time',
    complete: 'Signal complete!',
  }

  return (
    <>
      <PageHeader eyebrow={`Moon campaign · ${isBonus ? 'Bonus signal' : 'Signal'}`} title={titles[step]}>
        {step === 'catch' ? `The signal is coming from ${artifact.location.description}.` : `${artifact.name}, ${artifact.missionName}`}
      </PageHeader>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Level steps">
          {LEVEL_STEPS.map((s) => {
            const done = LEVEL_STEPS.findIndex((x) => x.id === s.id) < LEVEL_STEPS.findIndex((x) => x.id === step)
            const current = s.id === step
            return (
              <li
                key={s.id}
                aria-current={current ? 'step' : undefined}
                className={`label rounded-full px-3 ${current ? 'c-yellow' : done && s.ready ? 'c-mint' : 'c-white opacity-70'}`}
              >
                {done && s.ready ? '✓ ' : ''}
                {s.label}
                {!s.ready && <span className="text-xs"> (soon)</span>}
              </li>
            )
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {step === 'catch' && (
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
            )}

            {step === 'discovery' && <MissionCard artifact={artifact} onNext={() => go(nextStep('discovery'))} />}

            {step === 'science' && <RealStoryCard level={level} artifact={artifact} onNext={() => go(nextStep('science'))} />}

            {step === 'complete' && (
              <Paper tone="mint" tilt={-0.6} innerClassName="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="mx-auto w-40 shrink-0 sm:w-48">
                  <MachineSprite kind={level.catcherSprite} className="w-full" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl">You explored {artifact.name}!</h2>
                  <p className="mt-2 font-display text-lg" aria-label={`${saved?.stars ?? 1} of 3 stars for this signal`}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} aria-hidden="true" className={`text-3xl ${i < (saved?.stars ?? 1) ? '' : 'opacity-25 grayscale'}`}>
                        ⭐
                      </span>
                    ))}
                  </p>
                  <p className="mt-1">
                    Moon stars: <strong>{totals.earned} / {totals.max}</strong>
                    {hasBadge && <span className="label c-yellow ml-2">🏅 {MOON_CAMPAIGN.badge.name} badge earned!</span>}
                  </p>
                  <p className="muted mt-1 text-sm">The repair mission and quiz, worth two more stars, arrive in the next update.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {nextArtifact ? (
                      <Link to={`/moon/campaign/${nextArtifact.id}`} className="cbtn c-yellow" onClick={() => setStep('catch')}>
                        Next signal 📡
                      </Link>
                    ) : (
                      <span className="label c-yellow">You found every signal on the Moon! 🎉</span>
                    )}
                    <Link to="/moon/campaign" className="cbtn c-sky">
                      Back to the Moon 🌕
                    </Link>
                    <button
                      type="button"
                      className="chip sticker c-white"
                      onClick={() => {
                        setRound((r) => r + 1)
                        go('catch')
                      }}
                    >
                      Play again
                    </button>
                  </div>
                </div>
              </Paper>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
