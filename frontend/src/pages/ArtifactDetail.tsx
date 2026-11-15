import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import ArtifactImage from '../components/ArtifactImage'
import { KeyFacts } from '../components/ArtifactPanel'
import Paper, { type PaperTone } from '../components/Paper'
import StatusBadge from '../components/StatusBadge'
import { STATUS_HELP, WORLD_COLOR } from '../data/labels'
import Timeline from '../components/Timeline'
import { useAstro } from '../hooks/useAstro'
import { artifactById, artifactsByWorld } from '../data'
import glossary from '../data/glossary.json'
import { usePageContext } from '../hooks/usePageContext'
import { WORLD_LABELS, type Artifact } from '../types/artifact'
import NotFound from './NotFound'

const ARCHIVE_PATH = { moon: '/moon', mars: '/mars', 'deep-space': '/deep-space' } as const

/** Glossary words that appear in this artifact's text, so children can ask Astro about them. */
function wordsToKnow(a: Artifact): string[] {
  const text = [a.story.join(' '), a.hardwareType, ...a.instruments.map((i) => `${i.name} ${i.purpose}`), ...a.discoveries]
    .join(' ')
    .toLowerCase()
  return glossary
    .filter((g) => [g.term, ...g.aliases].some((t) => text.includes(t.toLowerCase())))
    .map((g) => g.term)
    .slice(0, 6)
}

/** One piece of paper per part of the story, each glued on at its own slight angle. */
function Section({ title, children, tilt = 0, tone }: { title: string; children: React.ReactNode; tilt?: number; tone?: PaperTone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', damping: 18, stiffness: 150 }}
    >
      <Paper as="section" tone={tone} tilt={tilt} innerClassName="p-6 sm:p-8">
        <h2 className="scribble mb-4 inline-block text-2xl">{title}</h2>
        {children}
      </Paper>
    </motion.div>
  )
}

export default function ArtifactDetail() {
  const { id } = useParams()
  const artifact = artifactById(id)
  usePageContext('artifact', artifact?.id)
  const { open } = useAstro()

  if (!artifact) return <NotFound />

  const siblings = artifactsByWorld(artifact.world)
  const idx = siblings.findIndex((a) => a.id === artifact.id)
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length]
  const next = siblings[(idx + 1) % siblings.length]
  const words = wordsToKnow(artifact)

  return (
    <article className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 font-display text-dusk">
        <Link to={ARCHIVE_PATH[artifact.world]} className="sticker c-paper btn btn-sm min-h-10" style={{ '--r': '-2deg' } as React.CSSProperties}>
          ← {WORLD_LABELS[artifact.world]} Archive
        </Link>
        <span aria-hidden="true">›</span> <span className="text-chalk">{artifact.name}</span>
      </nav>

      {/* ---------- Hero ---------- */}
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial={{ opacity: 0, x: -20, rotate: -4 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ type: 'spring', damping: 18 }}>
          <Paper tone="white" tilt={-1.5} innerClassName="p-4">
            <ArtifactImage artifact={artifact} showCredit className="aspect-[4/3]" tilt={0.6} />
          </Paper>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', damping: 18, delay: 0.1 }}>
          <Paper tilt={1} innerClassName="px-6 pb-7 pt-5 sm:px-8">
            <p className="tape mb-3">{artifact.missionName}</p>
            <h1 className="text-4xl sm:text-5xl">{artifact.name}</h1>
            <p className="mt-3 text-xl">{artifact.tagline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={artifact.status} />
              {artifact.agency !== 'NASA' && <span className="label c-sky">Built by {artifact.agency}</span>}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="button" className={`cbtn ${WORLD_COLOR[artifact.world]}`} onClick={() => open(`Tell me about ${artifact.name} in simple words.`)}>
                Ask Astro about {artifact.name.split(' ')[0]}
              </button>
              <a href="#timeline" className="sticker c-white btn btn-sm">
                Jump to timeline
              </a>
            </div>
          </Paper>
        </motion.div>
      </div>

      <div className="mt-12 grid gap-9">
        <Section title={`The story of ${artifact.name}`} tilt={-0.4}>
          <div className="space-y-4 text-lg leading-relaxed">
            {artifact.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <Paper tone="yellow" tilt={-1.5} className="mt-7 max-w-2xl" innerClassName="p-4 text-lg">
            <span className="font-display font-extrabold">Fun fact! </span>
            {artifact.funFact}
          </Paper>
        </Section>

        <div className="grid gap-9 lg:grid-cols-2">
          <Section title="Mission facts" tilt={0.6}>
            <KeyFacts artifact={artifact} />
          </Section>
          <Section title="Why it was sent" tilt={-0.7} tone="mint">
            <ul className="space-y-3">
              {artifact.objectives.map((o) => (
                <li key={o} className="flex gap-3 text-lg">
                  <span aria-hidden="true">🎯</span>
                  {o}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title="Science instruments and what they do" tilt={0.3}>
          <div className="grid gap-4 sm:grid-cols-2">
            {artifact.instruments.map((ins) => (
              <div key={ins.name} className="inset p-4">
                <h3 className="text-lg">{ins.name}</h3>
                <p className="muted mt-1">{ins.purpose}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What it discovered" tilt={-0.5} tone="sky">
          <ul className="grid gap-3 sm:grid-cols-2">
            {artifact.discoveries.map((d) => (
              <li key={d} className="flex gap-3 rounded-md bg-sticker/60 p-4">
                <span aria-hidden="true" className="text-2xl">💡</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div id="timeline" className="grid scroll-mt-28 gap-9 lg:grid-cols-[1.4fr_1fr]">
          <Section title="Mission timeline" tilt={0.4}>
            <Timeline items={artifact.timeline.map((e, i) => ({ key: `${e.date}-${i}`, ...e }))} />
          </Section>
          <Section title="Mission ending and status today" tilt={-0.8}>
            <StatusBadge status={artifact.status} className="mb-3" />
            <p className="muted text-sm">{STATUS_HELP[artifact.status]}</p>
            <p className="mt-3 text-lg">{artifact.statusNote}</p>
            <div className="inset mt-4 p-4">
              <h3 className="text-lg">{artifact.trajectory ? 'Where it is heading' : 'Where it rests'}</h3>
              <p>{artifact.trajectory ?? artifact.location.description}</p>
              {artifact.location.lat !== undefined && artifact.location.lon !== undefined && (
                <p className="muted mt-1 text-sm">
                  Approx. {Math.abs(artifact.location.lat).toFixed(2)}° {artifact.location.lat >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(artifact.location.lon).toFixed(2)}° {artifact.location.lon >= 0 ? 'E' : 'W'} (landing site)
                </p>
              )}
            </div>
          </Section>
        </div>

        {words.length > 0 && (
          <Section title="Words to know" tilt={0.5} tone="lilac">
            <p className="mb-4">Not sure what a word means? Tap it and Astro will explain.</p>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="chip sticker c-white"
                  onClick={() => open(`What does "${w}" mean?`)}
                >
                  {w}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Sources" tilt={-0.3}>
          <p className="muted mb-3">Facts on this page come from these sources. Dates can differ slightly between time zones.</p>
          <ul className="space-y-2">
            {artifact.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link font-normal">
                  {s.title} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <nav className="flex flex-col justify-between gap-3 sm:flex-row" aria-label="More explorers">
          <Link to={`/artifact/${prev.id}`} className="sticker c-paper btn" style={{ '--r': '-1.5deg' } as React.CSSProperties}>
            ← {prev.name}
          </Link>
          <Link to={`/artifact/${next.id}`} className="sticker c-paper btn" style={{ '--r': '1.5deg' } as React.CSSProperties}>
            {next.name} →
          </Link>
        </nav>
      </div>
    </article>
  )
}
