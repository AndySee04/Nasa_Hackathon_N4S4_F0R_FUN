import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { artifacts, dateSortKey, ERAS, eraOf, formatDate } from '../data'
import { KIND_META } from '../data/labels'
import { KeyFacts } from '../components/ArtifactPanel'
import { HardwareIllustration } from '../components/ArtifactImage'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import StatusBadge from '../components/StatusBadge'
import { useNasaImage } from '../hooks/useNasaImage'
import { usePageContext } from '../hooks/usePageContext'
import {
  HARDWARE_LABELS,
  WORLD_LABELS,
  type Artifact,
  type HardwareType,
  type TimelineKind,
  type TimelineEvent,
  type World,
} from '../types/artifact'
import './MissionTimeline.css'

type Opt<T extends string> = T | 'all'
type RiverEvent = { artifact: Artifact; event: TimelineEvent; key: string }

const yearOf = (date: string) => Number(date.slice(0, 4))

const allEvents: RiverEvent[] = artifacts
  .flatMap((artifact) => artifact.timeline.map((event, index) => ({ artifact, event, key: `${artifact.id}-${index}` })))
  .sort((a, b) => dateSortKey(a.event.date).localeCompare(dateSortKey(b.event.date)))

const MIN_YEAR = Math.min(...allEvents.map(({ event }) => yearOf(event.date)))
const MAX_YEAR = Math.max(...allEvents.map(({ event }) => yearOf(event.date)))
const COMET_COLORS = ['#f9c846', '#f28a4a', '#6fd3a8', '#b9a6ff', '#63b7f0', '#f28ab2']
const DEFAULT_ARTIFACT_ID = artifacts.find((artifact) => artifact.status === 'operational')?.id ?? artifacts[0]?.id ?? ''
const TIMELINE_IMAGE_QUERIES: Record<string, string> = {
  'voyager-1': 'Voyager 1 Voyager spacecraft',
  'voyager-2': 'Voyager 2 spacecraft',
  'pioneer-11': 'Pioneer 11 spacecraft',
  'new-horizons': 'New Horizons spacecraft artist concept',
}

function EquipmentPicture({
  artifact,
  className = '',
  showCredit = false,
}: {
  artifact: Artifact
  className?: string
  showCredit?: boolean
}) {
  const imageState = useNasaImage(TIMELINE_IMAGE_QUERIES[artifact.id] ?? artifact.imageQuery)
  const [failed, setFailed] = useState(false)
  const showPhoto = imageState.status === 'ready' && !failed

  return (
    <span className={`equipment-picture ${className}`}>
      <span className="equipment-picture-frame">
        {showPhoto ? (
          <img
            src={imageState.image.url}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="equipment-picture-photo"
          />
        ) : (
          <span className={`equipment-picture-sketch${imageState.status === 'loading' ? ' is-loading' : ''}`}>
            <HardwareIllustration type={artifact.hardwareType} className="h-4/5 w-4/5" />
          </span>
        )}
        {showPhoto && <span className="equipment-picture-stamp">NASA</span>}
      </span>
      {showCredit && (
        <span className="equipment-picture-credit">
          {showPhoto ? (
            <>
              {imageState.image.title} · Credit: NASA{imageState.image.center ? ` (${imageState.image.center})` : ''} ·{' '}
              <a href={imageState.image.pageUrl} target="_blank" rel="noopener noreferrer" className="link font-normal">
                NASA Image Library
              </a>
            </>
          ) : imageState.status === 'loading' ? (
            'Searching NASA Image Library…'
          ) : (
            'NASA photo unavailable; original equipment illustration shown.'
          )}
        </span>
      )}
    </span>
  )
}

function missionEndYear(artifact: Artifact): number | null {
  if (artifact.status === 'operational') return null
  if (artifact.endDate) return yearOf(artifact.endDate)
  const finalEvent = artifact.timeline
    .filter((event) => event.kind === 'end' || event.kind === 'status')
    .sort((a, b) => dateSortKey(a.date).localeCompare(dateSortKey(b.date)))
    .at(-1)
  return finalEvent ? yearOf(finalEvent.date) : null
}

function hasEndedBy(artifact: Artifact, year: number): boolean {
  const endYear = missionEndYear(artifact)
  return endYear !== null && year > endYear
}

function statusAtYear(artifact: Artifact, year: number): string {
  if (year < yearOf(artifact.launchDate)) return 'Not launched yet'
  if (artifact.status === 'operational' && year === MAX_YEAR) return 'Still working'
  const endYear = missionEndYear(artifact)
  if (endYear !== null && year > endYear) return 'Mission ended'
  if (endYear !== null && year === endYear) return 'Final mission year'
  return 'In mission'
}

function latestEventByYear(artifact: Artifact, year: number): TimelineEvent | undefined {
  return artifact.timeline
    .filter((event) => yearOf(event.date) <= year)
    .sort((a, b) => dateSortKey(a.date).localeCompare(dateSortKey(b.date)))
    .at(-1)
}

function nextEventAfterYear(artifact: Artifact, year: number): TimelineEvent | undefined {
  return artifact.timeline
    .filter((event) => yearOf(event.date) > year)
    .sort((a, b) => dateSortKey(a.date).localeCompare(dateSortKey(b.date)))[0]
}

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Opt<T>
  options: { value: T; label: string }[]
  onChange: (value: Opt<T>) => void
}) {
  return (
    <div role="group" aria-label={label} className="timeline-filter-group">
      <p>{label}</p>
      <div>
        {[{ value: 'all' as Opt<T>, label: 'All' }, ...options].map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className="chip sticker c-white"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MissionTimeline() {
  usePageContext('timeline')
  const [world, setWorld] = useState<Opt<World>>('all')
  const [era, setEra] = useState<Opt<string>>('all')
  const [hardware, setHardware] = useState<Opt<HardwareType>>('all')
  const [kind, setKind] = useState<Opt<TimelineKind>>('all')
  const [year, setYear] = useState(MAX_YEAR)
  const [selectedId, setSelectedId] = useState(DEFAULT_ARTIFACT_ID)
  const [showDeparted, setShowDeparted] = useState(false)
  const selectedDetailsRef = useRef<HTMLElement>(null)

  const hardwareTypes = Array.from(new Set(artifacts.map((artifact) => artifact.hardwareType)))
  const filteredArtifacts = useMemo(
    () =>
      artifacts.filter(
        (artifact) =>
          (world === 'all' || artifact.world === world) &&
          (era === 'all' || eraOf(artifact) === era) &&
          (hardware === 'all' || artifact.hardwareType === hardware) &&
          (kind === 'all' || artifact.timeline.some((event) => event.kind === kind)),
      ),
    [world, era, hardware, kind],
  )
  const filteredEvents = useMemo(
    () =>
      filteredArtifacts
        .flatMap((artifact) =>
          artifact.timeline
            .filter((event) => kind === 'all' || event.kind === kind)
            .map((event, index) => ({ artifact, event, key: `${artifact.id}-${index}` })),
        )
        .sort((a, b) => dateSortKey(a.event.date).localeCompare(dateSortKey(b.event.date))),
    [filteredArtifacts, kind],
  )

  const launchedArtifacts = filteredArtifacts
    .filter((artifact) => yearOf(artifact.launchDate) <= year)
    .sort((a, b) => dateSortKey(a.launchDate).localeCompare(dateSortKey(b.launchDate)))
  const departedCount = launchedArtifacts.filter((artifact) => hasEndedBy(artifact, year)).length
  const riverArtifacts = launchedArtifacts.filter((artifact) => showDeparted || !hasEndedBy(artifact, year))
  const selectedArtifact = filteredArtifacts.find((artifact) => artifact.id === selectedId) ?? filteredArtifacts[0] ?? null
  const selectedYearEvents = filteredEvents.filter(({ event }) => yearOf(event.date) === year)
  const selectedEvents = selectedArtifact?.timeline.filter((event) => yearOf(event.date) === year) ?? []
  const previousEvent = selectedArtifact ? latestEventByYear(selectedArtifact, year) : undefined
  const nextEvent = selectedArtifact ? nextEventAfterYear(selectedArtifact, year) : undefined

  const showArtifactDetails = (id: string) => {
    if (!filteredArtifacts.some((artifact) => artifact.id === id)) {
      setWorld('all')
      setEra('all')
      setHardware('all')
      setKind('all')
    }
    setSelectedId(id)
    window.requestAnimationFrame(() => {
      const details = selectedDetailsRef.current
      if (!details) return
      details.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
      details.focus({ preventScroll: true })
    })
  }

  return (
    <>
      <PageHeader eyebrow="Module D · Mission Timeline" title="River of Stars">
        Slide the mission clock and watch working spacecraft ride the river. Ended missions drift away, but their records stay in
        the archive.
      </PageHeader>

      <div className="star-river-page mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Paper tone="mint" className="star-river-filters" innerClassName="p-4 sm:p-5">
          <details>
            <summary>Refine the river <span>({filteredArtifacts.length} of {artifacts.length} missions)</span></summary>
            <div className="star-river-filter-grid">
              <FilterGroup
                label="Destination"
                value={world}
                onChange={setWorld}
                options={(Object.keys(WORLD_LABELS) as World[]).map((value) => ({ value, label: WORLD_LABELS[value] }))}
              />
              <FilterGroup
                label="Mission era"
                value={era}
                onChange={setEra}
                options={ERAS.map((value) => ({ value, label: value }))}
              />
              <FilterGroup
                label="Equipment"
                value={hardware}
                onChange={setHardware}
                options={hardwareTypes.map((value) => ({ value, label: HARDWARE_LABELS[value] }))}
              />
              <FilterGroup
                label="Milestone"
                value={kind}
                onChange={setKind}
                options={(Object.keys(KIND_META) as TimelineKind[]).map((value) => ({
                  value,
                  label: `${KIND_META[value].icon} ${KIND_META[value].label}`,
                }))}
              />
            </div>
          </details>
        </Paper>

        <section className="star-river-console" aria-labelledby="star-river-title">
          <div className="star-river-console-heading">
            <div>
              <p className="star-river-kicker">Mission control · one year at a time</p>
              <h2 id="star-river-title">Follow the working spacecraft</h2>
            </div>
            <p className="star-river-live"><span aria-hidden="true" /> YEAR {year}</p>
          </div>

          <div className="star-river-board" aria-label={`Mission river in ${year}`}>
            <svg className="star-river-path" viewBox="0 0 1200 440" preserveAspectRatio="none" aria-hidden="true">
              <path d="M-30 270C170 70 345 400 530 228S850 60 1010 235s220 160 280 10" />
              <path d="M-30 270C170 70 345 400 530 228S850 60 1010 235s220 160 280 10" />
            </svg>
            <div className="star-river-comets">
              <AnimatePresence mode="popLayout">
                {riverArtifacts.map((artifact) => {
                  const colorIndex = artifacts.findIndex((item) => item.id === artifact.id) % COMET_COLORS.length
                  const latestEvent = latestEventByYear(artifact, year)
                  const missionStatus = statusAtYear(artifact, year)
                  const departed = hasEndedBy(artifact, year)
                  return (
                    <motion.button
                      key={artifact.id}
                      type="button"
                      layout
                      initial={{ opacity: 0, y: 22, scale: 0.8 }}
                      animate={{ opacity: departed ? 0.58 : 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: '110vw', y: -100, rotate: 28, scale: 0.65, transition: { duration: 0.5 } }}
                      aria-pressed={selectedArtifact?.id === artifact.id}
                      aria-label={`${artifact.name}, ${year}: ${missionStatus}`}
                      onClick={() => showArtifactDetails(artifact.id)}
                      className={`star-comet${selectedArtifact?.id === artifact.id ? ' is-selected' : ''}${departed ? ' is-departed' : ''}`}
                      style={{ '--comet-color': COMET_COLORS[colorIndex] } as CSSProperties}
                    >
                      <EquipmentPicture artifact={artifact} className="star-comet-picture" />
                      <span className="star-comet-copy">
                        <span className="star-comet-world">{WORLD_LABELS[artifact.world]}</span>
                        <strong>{artifact.name}</strong>
                        <span className="star-comet-time">{year} · {missionStatus}</span>
                        <span className="star-comet-event">
                          {latestEvent ? `${formatDate(latestEvent.date)} · ${latestEvent.label}` : `Launch · ${formatDate(artifact.launchDate)}`}
                        </span>
                      </span>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
              {riverArtifacts.length === 0 && (
                <p className="star-river-empty">No equipment is on the river for these filters. Try another destination or milestone.</p>
              )}
            </div>
            <span className="star-river-star star-river-star--one" aria-hidden="true">✦</span>
            <span className="star-river-star star-river-star--two" aria-hidden="true">✧</span>
            <span className="star-river-star star-river-star--three" aria-hidden="true">✦</span>
          </div>

          <div className="star-river-scrubber">
            <div className="star-river-scrubber-heading">
              <label htmlFor="mission-year-slider">Slide the mission clock</label>
              <output className="star-river-year" htmlFor="mission-year-slider">{year}</output>
            </div>
            <input
              id="mission-year-slider"
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              step="1"
              value={year}
              aria-label="Mission timeline year"
              aria-valuetext={`${year}`}
              onChange={(event) => setYear(Number(event.target.value))}
            />
            <div className="star-river-year-marks" aria-hidden="true">
              <span>{MIN_YEAR}</span>
              <span>1980</span>
              <span>2000</span>
              <span>2020</span>
              <span>{MAX_YEAR}</span>
            </div>
            <div className="star-river-focus-row">
              <p role="status">
                {showDeparted
                  ? `${riverArtifacts.length} missions on the river in ${year}.`
                  : `${riverArtifacts.length} missions in view · ${departedCount} departed comet${departedCount === 1 ? '' : 's'} moved out of focus.`}
              </p>
              <button
                type="button"
                className="star-river-archive-toggle"
                aria-pressed={showDeparted}
                onClick={() => setShowDeparted((shown) => !shown)}
              >
                {showDeparted ? 'Focus on active missions' : `Show ${departedCount} departed comets`}
              </button>
            </div>
          </div>
        </section>

        <section className="star-river-milestones" aria-labelledby="year-milestones-title">
          <div className="star-river-section-heading">
            <div>
              <p className="star-river-kicker">Signals in the selected year</p>
              <h2 id="year-milestones-title">Milestones from {year}</h2>
            </div>
            <span>{selectedYearEvents.length} {selectedYearEvents.length === 1 ? 'milestone' : 'milestones'}</span>
          </div>
          {selectedYearEvents.length > 0 ? (
            <div className="star-river-event-grid">
              {selectedYearEvents.map(({ artifact, event, key }) => (
                <Paper key={key} as="article" className="star-river-event-card" innerClassName="p-4">
                  <p className="star-river-event-date">
                    <span className={`star-river-event-kind ${KIND_META[event.kind].color}`}>{KIND_META[event.kind].icon} {KIND_META[event.kind].label}</span>
                    <time dateTime={event.date}>{formatDate(event.date)}</time>
                  </p>
                  <h3>{artifact.name}</h3>
                  <p>{event.label}</p>
                  <div className="star-river-event-actions">
                    <button type="button" className="link" onClick={() => showArtifactDetails(artifact.id)}>Follow this equipment</button>
                    <Link to={`/artifact/${artifact.id}`} className="link">Full record →</Link>
                  </div>
                </Paper>
              ))}
            </div>
          ) : (
            <Paper tone="sky" className="star-river-no-milestones" innerClassName="p-5">
              No recorded milestones in {year}. The selected equipment panel shows the nearest known mission update.
            </Paper>
          )}
        </section>

        {selectedArtifact && (
          <section
            id="selected-equipment"
            ref={selectedDetailsRef}
            tabIndex={-1}
            className="star-river-selected"
            aria-labelledby="selected-equipment-title"
          >
            <Paper tilt={0.3} tone="lilac" className="star-river-selected-paper" innerClassName="p-5 sm:p-8">
              <div className="star-river-detail-hero">
                <EquipmentPicture artifact={selectedArtifact} className="star-river-detail-picture" showCredit />
                <div className="star-river-detail-copy">
                  <p className="star-river-kicker">Equipment at {year} · {selectedArtifact.missionName}</p>
                  <h2 id="selected-equipment-title">{selectedArtifact.name}</h2>
                  <p className="star-river-detail-story">{selectedArtifact.story[0]}</p>
                  <div className="star-river-detail-badges">
                    <StatusBadge status={selectedArtifact.status} />
                    <span className="label c-sky">{HARDWARE_LABELS[selectedArtifact.hardwareType]}</span>
                  </div>
                </div>
              </div>
              <p className="star-river-temporal-status">
                Mission status in {year}: <strong>{statusAtYear(selectedArtifact, year)}</strong>
              </p>
              <div className="star-river-selected-event">
                {selectedEvents.length > 0 ? (
                  <>
                    <h3>Recorded this year</h3>
                    {selectedEvents.map((event) => (
                      <p key={`${event.date}-${event.label}`}>
                        <time dateTime={event.date}>{formatDate(event.date)}</time> · {event.label}
                      </p>
                    ))}
                  </>
                ) : previousEvent ? (
                  <>
                    <h3>Latest recorded update by {year}</h3>
                    <p><time dateTime={previousEvent.date}>{formatDate(previousEvent.date)}</time> · {previousEvent.label}</p>
                    {nextEvent && <p className="star-river-next-event">Next milestone: {formatDate(nextEvent.date)} · {nextEvent.label}</p>}
                  </>
                ) : (
                  <>
                    <h3>Before launch</h3>
                    <p>Launch is planned for {formatDate(selectedArtifact.launchDate)}. No mission events are recorded yet.</p>
                  </>
                )}
              </div>
              <div className="star-river-facts">
                <KeyFacts artifact={selectedArtifact} />
              </div>
              <div className="star-river-kid-facts">
                <section>
                  <h3>Tools aboard</h3>
                  <ul>
                    {selectedArtifact.instruments.map((instrument) => (
                      <li key={instrument.name}>
                        <strong>{instrument.name}</strong>
                        <span>{instrument.purpose}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Big discoveries</h3>
                  <ul>
                    {selectedArtifact.discoveries.map((discovery) => <li key={discovery}>{discovery}</li>)}
                  </ul>
                </section>
              </div>
              <div className="star-river-selected-footer">
                <p>{selectedArtifact.tagline}</p>
                <Link to={`/artifact/${selectedArtifact.id}`} className="cbtn c-yellow">Explore the full equipment record</Link>
              </div>
            </Paper>
          </section>
        )}

        <details className="star-river-library">
          <summary>Mission archive · all {artifacts.length} equipment records stay available</summary>
          <div className="star-river-library-grid">
            {artifacts.map((artifact) => (
              <Paper key={artifact.id} as="article" className="star-river-library-card" innerClassName="flex h-full flex-col p-4">
                <p className="star-river-library-world">{WORLD_LABELS[artifact.world]} · {HARDWARE_LABELS[artifact.hardwareType]}</p>
                <h3>{artifact.name}</h3>
                <p className="muted">{artifact.missionName} · launched {formatDate(artifact.launchDate)}</p>
                <div className="mt-2"><StatusBadge status={artifact.status} /></div>
                <p className="flex-1">{artifact.tagline}</p>
                <div className="star-river-library-actions">
                  <button type="button" className="link" onClick={() => showArtifactDetails(artifact.id)}>View details</button>
                  <Link to={`/artifact/${artifact.id}`} className="link">Full record →</Link>
                </div>
              </Paper>
            ))}
          </div>
        </details>
      </div>
    </>
  )
}
