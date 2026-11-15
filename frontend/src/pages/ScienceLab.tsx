import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import ScienceVisual from '../components/ScienceVisual'
import { artifactById } from '../data'
import { QUIZ, SCIENCE_TOPICS, SIGNAL_DESTINATIONS } from '../data/science'
import { useAstro } from '../hooks/useAstro'
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
    <Paper tilt={-0.6} className="h-full" innerClassName="h-full p-6 sm:p-8">
      <p className="tape c-sky mb-3">Try it</p>
      <h2 className="text-2xl">Signal timer: how long does a message take?</h2>
      <p className="mt-2">Radio messages travel at the speed of light, about 300,000 km every second. Choose where to send yours.</p>
      <div className="mt-4 flex flex-wrap gap-2.5" role="group" aria-label="Destination">
        {SIGNAL_DESTINATIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={dest.id === d.id}
            disabled={sending}
            onClick={() => setDest(d)}
            className="chip sticker c-white"
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="relative mt-6 h-20 rounded-[40px_30px_44px_28px] bg-night">
        <span className="absolute inset-x-14 top-1/2 border-t-[3px] border-dashed border-chalk/30" aria-hidden="true" />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-4xl" aria-hidden="true">🌍</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl" aria-hidden="true">
          {dest.id === 'moon' ? '🌕' : dest.id.startsWith('mars') ? '🔴' : '🛰️'}
        </span>
        <AnimatePresence>
          {sending && (
            <motion.span
              key={dest.id}
              className="absolute top-1/2 -mt-3 h-6 w-6 rounded-full border-4 border-sticker bg-yellow"
              initial={{ left: '12%' }}
              animate={{ left: '82%' }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: animSeconds, ease: 'linear' }}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg" aria-live="polite">
          One-way trip to {dest.label}: <strong className="label c-yellow text-lg font-extrabold">{dest.display}</strong>
        </p>
        <button type="button" className="cbtn c-sky" disabled={sending} onClick={() => setSending(true)}>
          {sending ? 'Sending…' : 'Send a message 📡'}
        </button>
      </div>
      <p className="muted mt-3 text-sm">The animation is sped up so you don&apos;t have to wait a whole day!</p>
    </Paper>
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
    <Paper tone="yellow" tilt={0.6} className="h-full" innerClassName="h-full p-6 sm:p-8">
      <p className="tape c-pink mb-3">Discovery challenge</p>
      {done ? (
        <div className="mt-2 space-y-4 text-center">
          <p className="text-6xl" aria-hidden="true">{score === QUIZ.length ? '🏆' : score >= 3 ? '🚀' : '🌱'}</p>
          <h2 className="text-3xl">
            You scored {score} out of {QUIZ.length}!
          </h2>
          <p className="text-lg">{score === QUIZ.length ? 'Mission control is impressed!' : 'Great exploring. Read a topic again and have another go!'}</p>
          <button type="button" className="cbtn c-pink" onClick={restart}>
            Play again
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl">Quick quiz</h2>
            <span className="label c-white font-display text-sm">
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
                  aria-disabled={picked !== null}
                  className={`sticker min-h-14 rounded-[20px] px-5 py-2.5 text-left text-lg ${
                    state === 'right' ? 'c-mint' : state === 'wrong' ? 'c-orange' : 'c-white'
                  }`}
                  style={{ '--r': `${i % 2 ? 0.5 : -0.5}deg` } as React.CSSProperties}
                >
                  <span className="mr-2 font-display font-extrabold">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {state === 'right' && <span className="ml-2 font-display font-extrabold">✓ Correct</span>}
                  {state === 'wrong' && <span className="ml-2 font-display font-extrabold">✗ Not this one</span>}
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-sticker/70 p-4"
            >
              <p>
                <strong className="font-display">{picked === q.answer ? 'Great thinking! ' : 'Good try! '}</strong>
                {q.explain}
              </p>
              <button type="button" className="cbtn c-pink" onClick={nextQ}>
                {index + 1 === QUIZ.length ? 'See my score' : 'Next question'}
              </button>
            </motion.div>
          )}
        </>
      )}
    </Paper>
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

      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-[330px_1fr]">
          <div className="grid gap-3" role="tablist" aria-label="Science questions">
            {SCIENCE_TOPICS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === topicId}
                aria-controls="science-panel"
                onClick={() => setTopicId(t.id)}
                className="chip sticker c-paper min-h-14 rounded-[22px] px-4 py-2 text-[1.05rem]"
                style={{ '--r': `${i % 2 ? 0.8 : -0.8}deg` } as React.CSSProperties}
              >
                {t.question}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 14, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            >
              <Paper as="section" id="science-panel" role="tabpanel" tilt={0.4} innerClassName="grid gap-7 p-6 sm:p-8 xl:grid-cols-2">
                <div>
                  <h2 className="text-3xl">{topic.question}</h2>
                  <p className="mt-3 text-lg">
                    <span className="label c-sky text-lg">{topic.short}</span>
                  </p>
                  <ol className="mt-5 space-y-4 pl-0">
                    {topic.steps.map((s, i) => (
                      <li key={s} className="flex list-none gap-4">
                        <span
                          className="sticker c-lilac flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 font-display font-extrabold"
                          style={{ '--r': `${i % 2 ? 6 : -6}deg` } as React.CSSProperties}
                        >
                          {i + 1}
                        </span>
                        <p className="text-lg leading-relaxed">{s}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-5">
                  <div className="polaroid" style={{ '--r': '-1deg' } as React.CSSProperties}>
                    <ScienceVisual visual={topic.visual} />
                  </div>
                  <Paper tone="yellow" tilt={1} innerClassName="p-4">
                    <span className="font-display font-extrabold">Real example: </span>
                    {topic.example}
                  </Paper>
                  <div>
                    <p className="mb-2 font-display">See it in the museum:</p>
                    <div className="flex flex-wrap gap-2.5">
                      {topic.relatedArtifacts.map((id) => {
                        const a = artifactById(id)
                        return a ? (
                          <Link key={id} to={`/artifact/${id}`} className="chip sticker c-white no-underline">
                            {a.name} →
                          </Link>
                        ) : null
                      })}
                    </div>
                  </div>
                  <button type="button" className="sticker c-white btn btn-sm" onClick={() => open(topic.question)}>
                    Still curious? Ask Astro
                  </button>
                </div>
              </Paper>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid gap-9 lg:grid-cols-2">
          <SignalTimer />
          <Quiz />
        </div>
      </div>
    </>
  )
}
