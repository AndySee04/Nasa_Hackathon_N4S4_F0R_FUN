import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MissionBriefing from '../components/game/MissionBriefing'
import MoonScene, { type ScenePin } from '../components/game/MoonScene'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import { artifactById, formatDate } from '../data'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'
import { MOON_FACT_SOURCES, MOON_FACTS } from '../data/campaigns/moonFacts'
import { projectNearSide, spreadPins } from '../game/moonMap'
import { campaignStars } from '../game/progress'
import { useProgress } from '../game/useProgress'
import { usePageContext } from '../hooks/usePageContext'
import type { CampaignArtifact } from '../types/campaign'

const LEVELS: (CampaignArtifact & { bonus: boolean })[] = [
  ...MOON_CAMPAIGN.artifacts.map((a) => ({ ...a, bonus: false })),
  ...MOON_CAMPAIGN.bonusArtifacts.map((a) => ({ ...a, bonus: true })),
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

export default function MoonCampaign() {
  usePageContext('moon-campaign')
  const { progress, reset } = useProgress()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [factsOpen, setFactsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  const saved = progress.campaigns[MOON_CAMPAIGN.id]?.artifacts ?? {}
  const stars = campaignStars(progress, MOON_CAMPAIGN)
  const hasBadge = progress.campaigns[MOON_CAMPAIGN.id]?.badges.includes(MOON_CAMPAIGN.badge.id) ?? false

  const { pins, anyNudged } = useMemo(() => {
    const raw = LEVELS.map((l) => {
      const loc = artifactById(l.artifactId)?.location
      return projectNearSide(loc?.lat ?? 0, loc?.lon ?? 0)
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
    <>
      <PageHeader eyebrow="Moon campaign · Mission 1" title="Moon Explorer Mission">
        Real machines from real missions are still on the Moon. Find each signal, catch the machine with your rocket claw, and learn what it
        did.
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <MissionBriefing text={MOON_CAMPAIGN.briefing} onStart={() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div ref={mapRef}>
            <MoonScene
              pins={scenePins}
              selectedId={selectedId}
              onSelectPin={setSelectedId}
              onMoonClick={() => setFactsOpen((o) => !o)}
              factsOpen={factsOpen}
            />
            <p className="mt-4 text-center text-dusk">
              <span aria-hidden="true">📡</span> Orange pins are signals you haven&apos;t found yet. Tap the Moon itself for Moon facts.
            </p>
            {anyNudged && (
              <p className="mt-1 text-center text-sm text-dusk">
                Pins are placed at the real landing sites. A few landed so close together that we moved their pins apart a little so you can tap them.
              </p>
            )}
          </div>

          <div className="space-y-8">
            <Paper tone="mint" tilt={0.8} innerClassName="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display text-lg">Your stars</p>
                <p className="text-3xl font-extrabold" aria-live="polite">
                  {stars.earned} / {stars.max}
                  {stars.earned > stars.max && <span className="text-base font-normal"> (bonus stars!)</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg">{MOON_CAMPAIGN.badge.name} badge</p>
                <p>{hasBadge ? '🏅 Earned!' : 'Catch all 4 machines to earn it'}</p>
              </div>
            </Paper>

            <AnimatePresence mode="wait">
              {selected && selectedArtifact ? (
                <motion.div key={selected.artifactId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <Paper tilt={-0.6} innerClassName="p-6">
                    <p className={`tape mb-3 ${selected.bonus ? 'c-lilac' : 'c-orange'}`}>{selected.bonus ? 'Bonus signal' : 'Mystery signal'}</p>
                    {selectedStars > 0 ? (
                      <>
                        <h2 className="text-2xl">{selectedArtifact.name}</h2>
                        <p className="muted">
                          {selectedArtifact.missionName} · landed {formatDate(selectedArtifact.arrivalDate)}
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl">Something is down there…</h2>
                        <p className="muted">Signal from: {selectedArtifact.location.description}</p>
                      </>
                    )}
                    <div className="mt-3">
                      <Stars count={selectedStars} />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button type="button" className="cbtn c-yellow" disabled>
                        🚀 Launch rocket claw
                      </button>
                      <span className="muted text-sm">The rocket claw arrives in the next update.</span>
                    </div>
                  </Paper>
                </motion.div>
              ) : (
                <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Paper tone="sky" tilt={-0.6} innerClassName="p-6">
                    <h2 className="text-2xl">Pick a signal</h2>
                    <p className="mt-2">Tap a 📡 pin on the Moon to see where the signal is coming from.</p>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {factsOpen && (
                <motion.section
                  id="moon-facts"
                  aria-label="Moon facts"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                >
                  <Paper tone="cream" tilt={0.5} innerClassName="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl">Moon facts</h2>
                      <button type="button" className="chip sticker c-white" onClick={() => setFactsOpen(false)}>
                        Close ✕
                      </button>
                    </div>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {MOON_FACTS.map((f) => (
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
                      {MOON_FACT_SOURCES.map((s, i) => (
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
              <Link to="/moon" className="link">
                Visit the Moon Archive
              </Link>
              <span aria-hidden="true">·</span>
              {confirmReset ? (
                <span className="flex flex-wrap items-center gap-2">
                  Wipe all your Moon stars?
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
    </>
  )
}
