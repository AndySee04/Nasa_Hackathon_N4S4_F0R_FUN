import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MissionBriefing from '../components/game/MissionBriefing'
import MarsScene from '../components/game/MarsScene'
import type { ScenePin } from '../components/game/MoonScene'
import Paper from '../components/Paper'
import { artifactById, formatDate } from '../data'
import { MARS_CAMPAIGN } from '../data/campaigns/mars'
import { MARS_FACT_SOURCES, MARS_FACTS } from '../data/campaigns/marsFacts'
import { projectMarsGlobe } from '../game/marsMap'
import { spreadPins } from '../game/moonMap'
import { campaignStars } from '../game/progress'
import { useProgress } from '../game/useProgress'
import { usePageContext } from '../hooks/usePageContext'
import type { MarsLevel } from '../types/campaign'

const LEVELS: (MarsLevel & { bonus: boolean })[] = [
  ...MARS_CAMPAIGN.artifacts.map((a) => ({ ...a, bonus: false })),
  ...MARS_CAMPAIGN.bonusArtifacts.map((a) => ({ ...a, bonus: true })),
]

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`${count} of 3 stars`} className="text-xl tracking-wider">
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden="true" className={i < count ? '' : 'opacity-25 grayscale'}>
          ⭐
        </span>
      ))}
    </span>
  )
}

export default function MarsCampaign() {
  usePageContext('mars-campaign')
  const { progress, reset } = useProgress()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [factsOpen, setFactsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const sideRef = useRef<HTMLDivElement>(null)

  /** Phones and tablets show the signal card under the map, so bring it into view after a tap. */
  function selectPin(id: string | null) {
    setSelectedId(id)
    if (id && !window.matchMedia('(min-width: 64rem)').matches) {
      requestAnimationFrame(() => sideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    }
  }

  const saved = progress.campaigns[MARS_CAMPAIGN.id]?.artifacts ?? {}
  const stars = campaignStars(progress, MARS_CAMPAIGN)
  const hasBadge = progress.campaigns[MARS_CAMPAIGN.id]?.badges.includes(MARS_CAMPAIGN.badge.id) ?? false

  const { pins, anyNudged } = useMemo(() => {
    const raw = LEVELS.map((l) => {
      const loc = artifactById(l.artifactId)?.location
      return projectMarsGlobe(loc?.lat ?? 0, loc?.lon ?? 0)
    })
    const spread = spreadPins(raw)
    return {
      pins: LEVELS.map((l, i) => ({ id: l.artifactId, point: spread.points[i], bonus: l.bonus })),
      anyNudged: spread.nudged.some(Boolean),
    }
  }, [])

  const scenePins: ScenePin[] = pins.map((p) => ({
    ...p,
    label: artifactById(p.id)?.name ?? p.id,
    stars: saved[p.id]?.stars ?? 0,
  }))

  const selected = LEVELS.find((l) => l.artifactId === selectedId)
  const selectedArtifact = selected ? artifactById(selected.artifactId) : undefined
  const selectedStars = selected ? (saved[selected.artifactId]?.stars ?? 0) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* One strip: what this is and how far you have got. The map comes straight after it. */}
      <Paper tilt={-0.4} className="mb-6" innerClassName="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4">
        <div className="min-w-0 flex-1 basis-72">
          <p className="tape -ml-1 mb-2">Mars campaign · Mission 2</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">Mars Explorer Mission</h1>
          <p className="mt-1 max-w-3xl leading-snug">Mars once had rivers and lakes. Dig up the machines that found the clues.</p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border-2 border-ink/70 bg-mint px-4 py-2">
          <div>
            <p className="font-display text-sm">Your stars</p>
            <p className="text-2xl font-extrabold leading-tight" aria-live="polite">
              {stars.earned} / {stars.max}
              {stars.earned > stars.max && <span className="text-sm font-normal"> (bonus!)</span>}
            </p>
          </div>
          <div className="max-w-[13rem] text-sm leading-snug">
            <p className="font-display">{MARS_CAMPAIGN.badge.name} badge</p>
            {hasBadge ? (
              <Link to="/mars/certificate" className="link">
                🏅 Earned! Get your certificate
              </Link>
            ) : (
              <p>Earn all 3 stars on all 5 core machines</p>
            )}
          </div>
        </div>
      </Paper>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          {/* Never taller than the screen, so the whole planet and its pins show at once. */}
          <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-18rem))] min-w-[18rem]">
            <MarsScene
              pins={scenePins}
              selectedId={selectedId}
              onSelectPin={selectPin}
              onMarsClick={() => setFactsOpen((o) => !o)}
              factsOpen={factsOpen}
            />
          </div>
          <p className="mt-4 text-center text-dusk">
            Each X marks a machine you haven&apos;t dug up yet. Stars are machines you found. Tap Mars itself for Mars facts.
          </p>
          {anyNudged && (
            <p className="mt-1 text-center text-sm text-dusk">
              Pins show where each machine landed, with the whole planet squeezed onto one ball. A few are close together, so we moved their pins
              apart a little so you can tap them.
            </p>
          )}
        </div>

        <div ref={sideRef} className="scroll-mt-28 space-y-6">
          <AnimatePresence mode="wait">
            {selected && selectedArtifact ? (
              <motion.div key={selected.artifactId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Paper tilt={-0.6} innerClassName="p-6">
                  <p className={`tape mb-3 ${selected.bonus ? 'c-lilac' : 'c-orange'}`}>{selected.bonus ? 'Bonus dig' : 'Buried signal'}</p>
                  {selectedStars > 0 ? (
                    <>
                      <h2 className="text-2xl">{selectedArtifact.name}</h2>
                      <p className="muted">
                        {selectedArtifact.missionName} · landed {formatDate(selectedArtifact.arrivalDate)}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl">Something is buried here…</h2>
                      <p className="muted">Signal from: {selectedArtifact.location.description}</p>
                    </>
                  )}
                  <div className="mt-3">
                    <Stars count={selectedStars} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link to={`/mars/campaign/${selected.artifactId}`} className="cbtn c-yellow">
                      ⛏️ {selectedStars > 0 ? (selectedStars < 3 ? 'Try for 3 stars' : 'Play again') : 'Start digging'}
                    </Link>
                  </div>
                </Paper>
              </motion.div>
            ) : (
              <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MissionBriefing compact text={MARS_CAMPAIGN.briefing} steps={MARS_CAMPAIGN.briefingSteps} tip={MARS_CAMPAIGN.briefingTip} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {factsOpen && (
              <motion.section
                id="mars-facts"
                aria-label="Mars facts"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                <Paper tone="cream" tilt={0.5} innerClassName="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl">Mars facts</h2>
                    <button type="button" className="chip sticker c-white" onClick={() => setFactsOpen(false)}>
                      Close ✕
                    </button>
                  </div>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {MARS_FACTS.map((f) => (
                      <li key={f.title} className="inset p-3">
                        <p className="font-display">
                          <span aria-hidden="true">{f.icon}</span> {f.title}
                        </p>
                        <p className="mt-1 text-[0.95rem]">{f.text}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="muted mt-4 text-sm">
                    Facts from{' '}
                    {MARS_FACT_SOURCES.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && ' and '}
                        <a className="link" href={s.url} target="_blank" rel="noreferrer">
                          {s.title}
                        </a>
                      </span>
                    ))}
                    .
                  </p>
                </Paper>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-3 text-dusk">
            <Link to="/mars" className="link">
              Visit the Mars Archive
            </Link>
            <span aria-hidden="true">·</span>
            {confirmReset ? (
              <span className="flex flex-wrap items-center gap-2">
                Wipe all your stars (Moon and Mars)?
                <button
                  type="button"
                  className="chip sticker c-pink"
                  onClick={() => {
                    reset()
                    setConfirmReset(false)
                  }}
                >
                  Yes, start over
                </button>
                <button type="button" className="chip sticker c-white" onClick={() => setConfirmReset(false)}>
                  Keep my stars
                </button>
              </span>
            ) : (
              <button type="button" className="link" onClick={() => setConfirmReset(true)}>
                Start over
              </button>
            )}
          </div>
          <p className="text-sm text-dusk">Your stars are saved only in this browser. We never ask for your name.</p>
        </div>
      </div>
    </div>
  )
}
