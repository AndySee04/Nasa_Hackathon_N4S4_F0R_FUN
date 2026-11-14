import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ScienceVisual from '../components/ScienceVisual'
import { useAstro } from '../hooks/useAstro'
import { artifactById } from '../data'
import { QUIZ, SCIENCE_TOPICS, SIGNAL_DESTINATIONS } from '../data/science'
import { usePageContext } from '../hooks/usePageContext'

/** Interactive: send a "ping" and watch a scaled-down signal travel. */
function SignalTimer() {
  const [dest, setDest] = useState(SIGNAL_DESTINATIONS[0])
  const [sending, setSending] = useState(false)

  // Animate on a log scale so 1.3 seconds and 1 day are both watchable (2 to 8 seconds on screen).
  const animSeconds = 2 + (Math.log10(dest.seconds + 1) / Math.log10(24 * 3600 + 1)) * 6

  useEffect(() => {
    if (!sending) return
    const t = setTimeout(() => setSending(false), animSeconds * 1000 + 300)
    return () => clearTimeout(t)
  }, [sending, animSeconds])

  return (
    <div className="glass p-6 sm:p-8">
      <p className="eyebrow">Try it</p>
      <h2 className="mt-1 text-2xl font-bold">Signal timer: how long does a message take?</h2>
      <p className="mt-2 text-muted">Radio messages travel at the speed of light, about 300,000 km every second. Choose where to send yours.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Destination">
        {SIGNAL_DESTINATIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={dest.id === d.id}
            disabled={sending}
            onClick={() => setDest(d)}
            className={`chip min-h-10 ${dest.id === d.id ? 'border-cyan bg-cyan/20 text-ink' : 'border-white/15 text-muted hover:text-ink'}`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="relative mt-6 h-16 overflow-hidden rounded-full bg-space-950/70">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-3xl" aria-hidden="true">🌍</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-3xl" aria-hidden="true">{dest.id === 'moon' ? '🌕' : dest.id.startsWith('mars') ? '🔴' : '🛰️'}</span>
        <AnimatePresence>
          {sending && (
            <motion.span
              key={dest.id}
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_20px_6px_rgba(34,211,238,0.6)]"
              initial={{ left: '8%' }}
              animate={{ left: '88%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: animSeconds, ease: 'linear' }}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg" aria-live="polite">
          One-way trip to {dest.label}: <strong className="text-cyan">{dest.display}</strong>
        </p>
        <button type="button" className="btn btn-primary" disabled={sending} onClick={() => setSending(true)}>
          {sending ? 'Sending…' : 'Send a message 📡'}
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">The animation is sped up so you don&apos;t have to wait a whole day!</p>
    </div>
  )
}

function Quiz() {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const done = index >= QUIZ.length
  const q = QUIZ[index]

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
  }
  const nextQ = () => {
    setPicked(null)
    setIndex((i) => i + 1)
  }
  const restart = () => {
    setIndex(0)
    setPicked(null)
    setScore(0)
  }

  return (
    <div className="glass p-6 sm:p-8">
      <p className="eyebrow">Discovery challenge</p>
      {done ? (
        <div className="mt-2 space-y-4 text-center">
          <p className="text-5xl" aria-hidden="true">{score === QUIZ.length ? '🏆' : score >= 3 ? '🚀' : '🌱'}</p>
          <h2 className="text-2xl font-bold">
            You scored {score} out of {QUIZ.length}!
          </h2>
          <p className="text-muted">{score === QUIZ.length ? 'Mission control is impressed!' : 'Great exploring. Read a topic again and have another go!'}</p>
          <button type="button" className="btn btn-primary" onClick={restart}>
            Play again
          </button>
        </div>
      ) : (
        <>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Quick quiz</h2>
            <span className="text-sm text-muted">
              Question {index + 1} of {QUIZ.length}
            </span>
          </div>
          <p className="mt-4 text-xl">{q.question}</p>
          <div className="mt-4 grid gap-3">
            {q.options.map((opt, i) => {
              const state = picked === null ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'idle'
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={`min-h-14 rounded-2xl border px-5 py-3 text-left text-lg transition ${
                    state === 'right'
                      ? 'border-status-operational bg-status-operational/15'
                      : state === 'wrong'
                        ? 'border-status-lost bg-status-lost/15'
                        : 'border-white/15 bg-white/[0.04] hover:border-cyan/50'
                  }`}
                >
                  <span className="mr-2 font-display font-bold text-cyan">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {state === 'right' && <span className="ml-2 font-semibold text-status-operational">✓ Correct</span>}
                  {state === 'wrong' && <span className="ml-2 font-semibold text-status-lost">✗ Not this one</span>}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
              <p>
                <strong>{picked === q.answer ? 'Great thinking! ' : 'Good try! '}</strong>
                {q.explain}
              </p>
              <button type="button" className="btn btn-primary" onClick={nextQ}>
                {index + 1 === QUIZ.length ? 'See my score' : 'Next question'}
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default function ScienceLab() {
  usePageContext('science-lab')
  const [topicId, setTopicId] = useState(SCIENCE_TOPICS[0].id)
  const topic = SCIENCE_TOPICS.find((t) => t.id === topicId)!
  const { open } = useAstro()

  return (
    <>
      <PageHeader eyebrow="Module E · Science Discovery Lab" title="Science Lab">
        How do machines millions of kilometres away move, talk, land and do science? Pick a question to find out.
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="grid h-fit gap-2" role="tablist" aria-label="Science questions">
            {SCIENCE_TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === topicId}
                aria-controls="science-panel"
                onClick={() => setTopicId(t.id)}
                className={`rounded-2xl border px-4 py-3 text-left font-display text-lg font-semibold transition ${
                  t.id === topicId ? 'border-cyan bg-cyan/15 text-ink' : 'border-white/10 bg-white/[0.04] text-muted hover:text-ink'
                }`}
              >
                {t.question}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={topic.id}
              id="science-panel"
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_1fr]"
            >
              <div>
                <h2 className="text-3xl font-bold">{topic.question}</h2>
                <p className="mt-2 text-lg text-cyan">{topic.short}</p>
                <ol className="mt-5 space-y-4">
                  {topic.steps.map((s, i) => (
                    <li key={s} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet/30 font-display font-bold">{i + 1}</span>
                      <p className="text-lg leading-relaxed">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-4">
                <ScienceVisual visual={topic.visual} />
                <p className="rounded-2xl border border-amber/30 bg-amber/10 p-4">
                  <span className="font-bold text-amber">Real example: </span>
                  {topic.example}
                </p>
                <div>
                  <p className="mb-2 text-sm font-semibold text-muted">See it in the museum:</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedArtifacts.map((id) => {
                      const a = artifactById(id)
                      return a ? (
                        <Link key={id} to={`/artifact/${id}`} className="chip min-h-10 border-white/15 text-ink hover:border-cyan">
                          {a.name} →
                        </Link>
                      ) : null
                    })}
                  </div>
                </div>
                <button type="button" className="btn btn-ghost w-full" onClick={() => open(topic.question)}>
                  Still curious? Ask Astro
                </button>
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SignalTimer />
          <Quiz />
        </div>
      </div>
    </>
  )
}
