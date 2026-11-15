import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MarsDig from '../components/game/MarsDig'
import MissionCard from '../components/game/MissionCard'
import QuizPanel from '../components/game/QuizPanel'
import RealStoryCard from '../components/game/RealStoryCard'
import RoverDrive from '../components/game/RoverDrive'
import { MachineSprite } from '../components/game/Sprites'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import { artifactById } from '../data'
import { MARS_CAMPAIGN } from '../data/campaigns/mars'
import { MARS_STEPS, nextMarsStep, nextSignal, type MarsStep } from '../game/levelFlow'
import { awardBadge, campaignStars, recordResult } from '../game/progress'
import { quizPassFor } from '../game/scoring'
import { useProgress } from '../game/useProgress'
import { usePageContext } from '../hooks/usePageContext'

const LEVELS = [...MARS_CAMPAIGN.artifacts, ...MARS_CAMPAIGN.bonusArtifacts]
const QUIZ_PASS = quizPassFor(MARS_CAMPAIGN.id)

/** The next machine without full stars (Mars needs 3 stars each for the badge), or null. */
function nextMarsSignal(stars: Record<string, { stars: number }>, currentId: string): string | null {
  const order = LEVELS.map((l) => l.artifactId)
  const start = order.indexOf(currentId)
  const rotated = [...order.slice(start + 1), ...order.slice(0, Math.max(start, 0))]
  return rotated.find((id) => (stars[id]?.stars ?? 0) < 3) ?? null
}

/** One Mars level: dig → mission card → drive → real story → quiz → done. */
export default function MarsLevel() {
  const { artifactId = '' } = useParams()
  const level = LEVELS.find((l) => l.artifactId === artifactId)
  const artifact = level ? artifactById(level.artifactId) : undefined
  usePageContext('mars-campaign', artifact?.id)
  const { progress, update } = useProgress()
  const [step, setStep] = useState<MarsStep>('dig')
  const [lastQuiz, setLastQuiz] = useState<number | null>(null)
  // A new round gives a new dig site and resets the drive.
  const [round, setRound] = useState(0)

  if (!level || !artifact) {
    return (
      <PageHeader eyebrow="Mars campaign" title="Signal lost!">
        We couldn&apos;t find that signal.{' '}
        <Link to="/mars/campaign" className="link">
          Back to Mars
        </Link>
      </PageHeader>
    )
  }

  const easy = progress.settings.easyMode
  const savedAll = progress.campaigns[MARS_CAMPAIGN.id]?.artifacts ?? {}
  const saved = savedAll[artifact.id]
  const go = (to: MarsStep) => {
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const next = nextMarsSignal(savedAll, artifact.id) ?? nextSignal(progress, MARS_CAMPAIGN, artifact.id)
  const nextArtifact = next ? artifactById(next) : undefined
  const totals = campaignStars(progress, MARS_CAMPAIGN)
  const hasBadge = progress.campaigns[MARS_CAMPAIGN.id]?.badges.includes(MARS_CAMPAIGN.badge.id) ?? false
  const isBonus = MARS_CAMPAIGN.bonusArtifacts.some((b) => b.artifactId === artifact.id)

  /** Saves one part of the level. recordResult keeps the best, so stars never go down. caught = dig star, repaired = drive star. */
  function save(result: { caught?: boolean; repaired?: boolean; quizCorrect?: number }) {
    update((p) =>
      awardBadge(recordResult(p, MARS_CAMPAIGN.id, artifact!.id, { caught: false, repaired: false, quizCorrect: 0, ...result }), MARS_CAMPAIGN),
    )
  }

  const titles: Record<MarsStep, string> = {
    dig: 'Dig it up!',
    discovery: 'Machine uncovered!',
    drive: level.drive.vehicle === 'helicopter' ? 'Plan a flight' : level.drive.vehicle === 'arm' ? 'Move the robotic arm' : 'Plan a drive',
    science: 'The real story',
    quiz: 'Quiz time',
    complete: 'Dig complete!',
  }

  return (
    <>
      <PageHeader eyebrow={`Mars campaign · ${isBonus ? 'Bonus dig' : 'Dig site'}`} title={titles[step]}>
        {step === 'dig' ? `Buried signal near ${artifact.location.description}.` : `${artifact.name}, ${artifact.missionName}`}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Level steps">
          {MARS_STEPS.map((s, i) => {
            const now = MARS_STEPS.findIndex((x) => x.id === step)
            return (
              <li
                key={s.id}
                aria-current={s.id === step ? 'step' : undefined}
                className={`label rounded-full px-3 ${s.id === step ? 'c-yellow' : i < now ? 'c-mint' : 'c-white opacity-70'}`}
              >
                {i < now ? '✓ ' : ''}
                {s.label}
              </li>
            )
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {step === 'dig' && (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <Link to="/mars/campaign" className="link text-chalk">
                    ← Back to Mars
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
                <p className="mb-4 text-chalk">
                  In real life these machines sit on the surface, slowly covered by dust. Here, each rock layer hides a true clue the machine
                  found about Mars&apos;s watery past.
                </p>
                <MarsDig
                  key={`${round}:${easy}`}
                  artifactId={artifact.id}
                  attempt={round}
                  sprite={level.sprite}
                  clues={level.clues}
                  easy={easy}
                  onRetry={() => setRound((r) => r + 1)}
                  onFound={(star) => {
                    save({ caught: star })
                    setLastQuiz(null)
                    go(nextMarsStep('dig'))
                  }}
                />
              </>
            )}

            {step === 'discovery' && (
              <MissionCard
                artifact={artifact}
                nextLabel={level.drive.vehicle === 'helicopter' ? 'Plan a flight 🚁' : level.drive.vehicle === 'arm' ? 'Move the arm 🦾' : 'Plan a drive 🛞'}
                onNext={() => go(nextMarsStep('discovery'))}
              />
            )}

            {step === 'drive' && (
              <RoverDrive
                key={round}
                level={level.drive}
                sprite={level.sprite}
                easy={easy}
                onDone={(star) => {
                  save({ repaired: star })
                  go(nextMarsStep('drive'))
                }}
              />
            )}

            {step === 'science' && <RealStoryCard level={level} artifact={artifact} onNext={() => go(nextMarsStep('science'))} />}

            {step === 'quiz' && (
              <QuizPanel
                questions={level.quiz}
                pass={QUIZ_PASS}
                onDone={(correct) => {
                  save({ quizCorrect: correct })
                  setLastQuiz(correct)
                  go(nextMarsStep('quiz'))
                }}
              />
            )}

            {step === 'complete' && (
              <Paper tone="mint" tilt={-0.6} innerClassName="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="mx-auto w-40 shrink-0 sm:w-48">
                  <MachineSprite kind={level.sprite} className="w-full" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl">You explored {artifact.name}!</h2>
                  <p className="mt-2 font-display text-lg" aria-label={`${saved?.stars ?? 0} of 3 stars for this machine`}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} aria-hidden="true" className={`text-3xl ${i < (saved?.stars ?? 0) ? '' : 'opacity-25 grayscale'}`}>
                        ⭐
                      </span>
                    ))}
                  </p>
                  <p className="mt-1">
                    Mars stars: <strong>{totals.earned} / {totals.max}</strong>
                    {hasBadge && (
                      <Link to="/mars/certificate" className="label c-yellow ml-2">
                        🏅 {MARS_CAMPAIGN.badge.name} badge earned! Get your certificate
                      </Link>
                    )}
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>{saved?.best.caught ? '⭐' : '☆'} Dug it up without the dust devil</li>
                    <li>{saved?.best.repaired ? '⭐' : '☆'} Reached the target within 3 sols</li>
                    <li>
                      {(saved?.best.quizCorrect ?? 0) >= QUIZ_PASS ? '⭐' : '☆'} Quiz: {lastQuiz ?? saved?.best.quizCorrect ?? 0} of {level.quiz.length} this
                      time (need {QUIZ_PASS})
                      {saved && saved.best.quizCorrect > (lastQuiz ?? 0) && ` (best ${saved.best.quizCorrect})`}
                    </li>
                  </ul>
                  {!isBonus && (saved?.stars ?? 0) < 3 && (
                    <p className="mt-2 text-sm">The {MARS_CAMPAIGN.badge.name} badge needs all 3 stars on every core machine. Play again to collect the rest!</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {nextArtifact && nextArtifact.id !== artifact.id ? (
                      <Link to={`/mars/campaign/${nextArtifact.id}`} className="cbtn c-yellow" onClick={() => setStep('dig')}>
                        Next dig site ⛏️
                      </Link>
                    ) : (
                      !next && <span className="label c-yellow">You earned every star on Mars! 🎉</span>
                    )}
                    <Link to="/mars/campaign" className="cbtn c-sky">
                      Back to Mars 🔴
                    </Link>
                    <button
                      type="button"
                      className="chip sticker c-white"
                      onClick={() => {
                        setRound((r) => r + 1)
                        go('dig')
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
