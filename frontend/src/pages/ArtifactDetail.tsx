import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import ArtifactImage from '../components/ArtifactImage'
import { KeyFacts } from '../components/ArtifactPanel'
import StatusBadge from '../components/StatusBadge'
import { STATUS_HELP } from '../data/labels'
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

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
      className="glass p-6 sm:p-8"
    >
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      {children}
    </motion.section>
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
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link to={ARCHIVE_PATH[artifact.world]} className="hover:text-cyan">
          {WORLD_LABELS[artifact.world]} Archive
        </Link>{' '}
        › <span className="text-ink">{artifact.name}</span>
      </nav>

      {/* ---------- Hero ---------- */}
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <ArtifactImage artifact={artifact} showCredit className="aspect-[4/3] shadow-2xl" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="eyebrow">{artifact.missionName}</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{artifact.name}</h1>
          <p className="mt-3 text-xl text-ink/90">{artifact.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={artifact.status} />
            {artifact.agency !== 'NASA' && <span className="chip border-amber/40 text-amber">Built by {artifact.agency}</span>}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => open(`Tell me about ${artifact.name} in simple words.`)}>
              Ask Astro about {artifact.name.split(' ')[0]}
            </button>
            <a href="#timeline" className="btn btn-ghost">
              Jump to timeline
            </a>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 grid gap-6">
        <Section title={`The story of ${artifact.name}`}>
          <div className="space-y-4 text-lg leading-relaxed">
            {artifact.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-ink">
            <span className="font-bold text-amber">Fun fact: </span>
            {artifact.funFact}
          </p>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Mission facts">
            <KeyFacts artifact={artifact} />
          </Section>
          <Section title="Why it was sent">
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

        <Section title="Science instruments and what they do">
          <div className="grid gap-4 sm:grid-cols-2">
            {artifact.instruments.map((ins) => (
              <div key={ins.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-display text-lg font-semibold text-cyan">{ins.name}</h3>
                <p className="mt-1 text-muted">{ins.purpose}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What it discovered">
          <ul className="grid gap-3 sm:grid-cols-2">
            {artifact.discoveries.map((d) => (
              <li key={d} className="flex gap-3 rounded-2xl bg-white/[0.04] p-4">
                <span aria-hidden="true" className="text-2xl">💡</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div id="timeline" className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Section title="Mission timeline">
            <Timeline items={artifact.timeline.map((e, i) => ({ key: `${e.date}-${i}`, ...e }))} />
          </Section>
          <Section title="Mission ending and status today">
            <StatusBadge status={artifact.status} className="mb-3" />
            <p className="text-sm text-muted">{STATUS_HELP[artifact.status]}</p>
            <p className="mt-3 text-lg">{artifact.statusNote}</p>
            <div className="mt-4 rounded-2xl bg-white/5 p-4">
              <h3 className="font-semibold">{artifact.trajectory ? 'Where it is heading' : 'Where it rests'}</h3>
              <p className="text-muted">{artifact.trajectory ?? artifact.location.description}</p>
              {artifact.location.lat !== undefined && artifact.location.lon !== undefined && (
                <p className="mt-1 text-sm text-muted">
                  Approx. {Math.abs(artifact.location.lat).toFixed(2)}° {artifact.location.lat >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(artifact.location.lon).toFixed(2)}° {artifact.location.lon >= 0 ? 'E' : 'W'} (landing site)
                </p>
              )}
            </div>
          </Section>
        </div>

        {words.length > 0 && (
          <Section title="Words to know">
            <p className="mb-3 text-muted">Not sure what a word means? Tap it and Astro will explain.</p>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="chip min-h-10 border-violet/40 bg-violet/10 text-ink hover:bg-violet/20"
                  onClick={() => open(`What does "${w}" mean?`)}
                >
                  {w}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Sources">
          <p className="mb-3 text-muted">Facts on this page come from these sources. Dates can differ slightly between time zones.</p>
          <ul className="space-y-2">
            {artifact.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cyan underline">
                  {s.title} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <nav className="flex flex-col justify-between gap-3 sm:flex-row" aria-label="More explorers">
          <Link to={`/artifact/${prev.id}`} className="btn btn-ghost">
            ← {prev.name}
          </Link>
          <Link to={`/artifact/${next.id}`} className="btn btn-ghost">
            {next.name} →
          </Link>
        </nav>
      </div>
    </article>
  )
}
