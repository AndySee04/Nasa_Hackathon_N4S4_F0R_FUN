import { motion } from 'framer-motion'
import { Suspense, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ArtifactCard from '../components/ArtifactCard'
import ArtifactPanel from '../components/ArtifactPanel'
import AstroAvatar from '../components/AstroAvatar'
import { SceneFallback, SpaceScene } from '../components/LazySpaceScene'
import { useAstro } from '../hooks/useAstro'
import { artifactById, artifacts, FEATURED_IDS } from '../data'
import { usePageContext } from '../hooks/usePageContext'
import type { Artifact } from '../types/artifact'

const featured = FEATURED_IDS.map((id) => artifactById(id)).filter((a): a is Artifact => Boolean(a))

const DISCOVERY_CARDS = [
  {
    icon: '🪞',
    title: 'Mirrors on the Moon',
    text: 'Apollo astronauts left mirrors on the Moon. Scientists still bounce lasers off them to measure how far away the Moon is.',
    to: '/artifact/apollo-11-eagle',
    cta: 'Meet Apollo 11\'s Eagle',
  },
  {
    icon: '🫐',
    title: 'Blueberries on Mars',
    text: 'Opportunity found tiny round "blueberries" made of hematite, a mineral that usually forms in water.',
    to: '/artifact/opportunity',
    cta: 'Meet Opportunity',
  },
  {
    icon: '📡',
    title: 'A message that takes a day',
    text: 'Voyager 1 is so far away that its radio signals take about a whole day to reach Earth.',
    to: '/science-lab',
    cta: 'Try the signal timer',
  },
  {
    icon: '🌋',
    title: 'Volcanoes beyond Earth',
    text: 'Voyager 1 spotted erupting volcanoes on Jupiter\'s moon Io, the first ever seen beyond Earth.',
    to: '/timeline',
    cta: 'Explore the timeline',
  },
]

export default function Home() {
  usePageContext('home')
  const navigate = useNavigate()
  const { open } = useAstro()
  const [selected, setSelected] = useState<Artifact | null>(null)
  const close = useCallback(() => setSelected(null), [])

  const counts = {
    total: artifacts.length,
    operational: artifacts.filter((a) => a.status === 'operational').length,
    worlds: new Set(artifacts.map((a) => a.world)).size,
  }

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
            <p className="eyebrow">An interactive digital space museum</p>
            <h1 className="mt-3 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              <span className="text-gradient">N4S4 F0R FUN</span>
            </h1>
            <p className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Explore the Forgotten. Discover the Extraordinary.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Since the 1960s, people have sent machines across the solar system. Some still stand on the Moon and Mars.
              Others are drifting between the stars, and a few are still talking to Earth. Meet these robotic explorers
              and discover what they taught us.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore" className="btn btn-primary text-lg">
                Explore Now <span aria-hidden="true">🚀</span>
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => open()}>
                <AstroAvatar className="h-7 w-7" /> Ask Astro AI
              </button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {[
                [counts.total, 'machines'],
                [counts.worlds, 'destinations'],
                [counts.operational, 'still working'],
              ].map(([n, label]) => (
                <div key={label} className="glass px-3 py-3 text-center">
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-bold text-cyan">{n}</span>
                    <span className="text-sm text-muted">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="glass relative overflow-hidden p-0">
              <Suspense fallback={<SceneFallback className="h-[340px] w-full sm:h-[440px] lg:h-[520px]" />}>
                <SpaceScene hero className="h-[340px] w-full sm:h-[440px] lg:h-[520px]" onSelect={(id) => id && navigate(`/explore?body=${id}`)} />
              </Suspense>
              <p className="pointer-events-none absolute bottom-3 left-4 right-4 text-sm text-muted">
                Drag to spin the solar system · tap a planet to explore it
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Featured spacecraft ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="featured-title">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured explorers</p>
            <h2 id="featured-title" className="mt-1 text-3xl font-bold sm:text-4xl">
              One from each frontier
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/moon" className="btn btn-ghost">Moon Archive</Link>
            <Link to="/mars" className="btn btn-ghost">Mars Archive</Link>
            <Link to="/deep-space" className="btn btn-ghost">Deep Space</Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((a, i) => (
            <ArtifactCard key={a.id} artifact={a} onSelect={setSelected} index={i} />
          ))}
        </div>
      </section>

      {/* ---------- Discovery cards ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="discover-title">
        <p className="eyebrow">Did you know?</p>
        <h2 id="discover-title" className="mt-1 text-3xl font-bold sm:text-4xl">
          Discoveries made by forgotten machines
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DISCOVERY_CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass flex flex-col gap-3 p-6"
            >
              <span className="text-4xl" aria-hidden="true">{c.icon}</span>
              <h3 className="text-xl font-bold">{c.title}</h3>
              <p className="flex-1 text-muted">{c.text}</p>
              <Link to={c.to} className="font-semibold text-cyan hover:underline">
                {c.cta} →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Ask Astro AI ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="astro-title">
        <div className="glass relative grid items-center gap-8 overflow-hidden p-8 sm:p-10 md:grid-cols-[auto_1fr]">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet/30 blur-3xl"
            aria-hidden="true"
          />
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <AstroAvatar className="h-32 w-32 sm:h-40 sm:w-40" />
          </motion.div>
          <div className="relative">
            <p className="eyebrow">Meet your guide</p>
            <h2 id="astro-title" className="mt-1 text-3xl font-bold sm:text-4xl">
              Stuck on a space word? Ask Astro!
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              Astro is a friendly AI helper. It explains spacecraft, instruments and science words in simple language,
              and it shows you where its facts come from.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['What is a descent stage?', 'Why did Opportunity stop working?', 'What is interstellar space?'].map((q) => (
                <button key={q} type="button" className="chip border-cyan/40 bg-cyan/10 text-ink hover:bg-cyan/20" onClick={() => open(q)}>
                  {q}
                </button>
              ))}
            </div>
            <Link to="/ask-astro" className="btn btn-primary mt-6">
              Open Astro AI
            </Link>
          </div>
        </div>
      </section>

      <ArtifactPanel artifact={selected} onClose={close} />
    </>
  )
}
