import { useMemo, useState } from 'react'
import { isNextInOrder, orderOf, pairsOf, shuffled, tryAgain } from '../../game/challenges'
import type { RepairChallenge as Challenge } from '../../types/campaign'
import Paper from '../Paper'

interface Props {
  challenge: Challenge
  seed: string
  onDone: (mistakes: number) => void
}

/**
 * Stage 4: a PRETEND repair in Mission Control's training simulator.
 * It is labelled clearly so children never think the real machines were fixed.
 * Every interaction is tap-to-choose, so it works the same with a mouse, a finger or a keyboard.
 */
export default function RepairChallenge({ challenge, seed, onDone }: Props) {
  return (
    <Paper tone="lilac" tilt={-0.4} innerClassName="p-5 sm:p-8">
      <p className="tape c-white mb-2">🎮 Pretend mission · training simulator</p>
      <h2 className="text-3xl">{challenge.title}</h2>
      <p className="mt-2 text-[0.95rem]">
        This is a practice game, like the simulators astronauts train in on Earth. The real machines on the Moon were not repaired.
      </p>
      <div className="mt-6">
        {challenge.kind === 'drag-parts' || challenge.kind === 'match-instruments' ? (
          <MatchGame challenge={challenge} seed={seed} onDone={onDone} />
        ) : (
          <OrderGame challenge={challenge} seed={seed} onDone={onDone} />
        )}
      </div>
    </Paper>
  )
}

/** Pick an item, then the description it belongs to. */
function MatchGame({ challenge, seed, onDone }: Props) {
  const pairs = useMemo(() => pairsOf(challenge), [challenge])
  const items = useMemo(() => shuffled(pairs, `${seed}:items`), [pairs, seed])
  const targets = useMemo(() => shuffled(pairs, `${seed}:targets`), [pairs, seed])
  const [picked, setPicked] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [message, setMessage] = useState(challenge.kind === 'drag-parts' ? 'Pick a part, then tap where it goes.' : 'Pick an instrument, then tap its job.')
  const done = matched.size === pairs.length

  function choose(targetId: string) {
    if (!picked || matched.has(targetId)) return
    if (picked === targetId) {
      const next = new Set(matched).add(targetId)
      setMatched(next)
      setPicked(null)
      setMessage(next.size === pairs.length ? 'All fixed! Great engineering!' : 'Yes! That fits.')
    } else {
      setMistakes((m) => m + 1)
      setMessage(tryAgain(mistakes))
    }
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h3 className="mb-2 text-xl">{challenge.kind === 'drag-parts' ? 'Parts' : 'Instruments'}</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose one">
            {items.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip sticker c-white"
                aria-pressed={picked === p.id}
                disabled={matched.has(p.id)}
                onClick={() => setPicked(p.id)}
              >
                {matched.has(p.id) ? '✓ ' : ''}
                {p.item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xl">{challenge.kind === 'drag-parts' ? 'Where does it go?' : 'What does it do?'}</h3>
          <ul className="space-y-2">
            {targets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => choose(t.id)}
                  disabled={matched.has(t.id) || !picked}
                  className={`w-full rounded-lg border-[3px] border-dashed p-3 text-left transition ${
                    matched.has(t.id) ? 'border-mint bg-mint/40' : 'border-ink/30 bg-sticker/80 enabled:hover:border-ink/70'
                  }`}
                >
                  {matched.has(t.id) && <strong className="mr-1">{t.item}:</strong>}
                  {t.target}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Footer message={message} done={done} onDone={() => onDone(mistakes)} />
    </div>
  )
}

/** Tap the steps (or circuit parts) in the right order. */
function OrderGame({ challenge, seed, onDone }: Props) {
  const { correct, shown } = useMemo(() => orderOf(challenge), [challenge])
  const options = useMemo(() => shuffled(shown, `${seed}:order`), [shown, seed])
  const [placed, setPlaced] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const circuit = challenge.kind === 'circuit'
  const [message, setMessage] = useState(circuit ? 'Connect the parts in order, starting where the power comes from.' : 'Tap what happened first, then what came next.')
  const done = placed.length === correct.length

  function choose(step: string) {
    if (placed.includes(step)) return
    if (isNextInOrder(correct, placed, step)) {
      const next = [...placed, step]
      setPlaced(next)
      setMessage(next.length === correct.length ? (circuit ? 'Power is flowing! Great wiring!' : 'Perfect order!') : 'Yes! What comes next?')
    } else {
      setMistakes((m) => m + 1)
      setMessage(tryAgain(mistakes))
    }
  }

  return (
    <div>
      <ol className={`mb-5 grid gap-2 ${circuit ? 'sm:grid-cols-4' : ''}`} aria-label={circuit ? 'Your circuit' : 'Your order'}>
        {correct.map((_, i) => (
          <li
            key={i}
            className={`flex min-h-12 items-center gap-2 rounded-lg border-[3px] p-2 ${placed[i] ? 'border-mint bg-mint/40' : 'border-dashed border-ink/25'}`}
          >
            <span className="font-display text-ink-soft">{i + 1}</span>
            <span className="font-bold">{placed[i] ?? ''}</span>
            {circuit && i < correct.length - 1 && placed[i + 1] && (
              <span className="ml-auto text-xl text-orange" aria-hidden="true">
                ⚡
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the next one">
        {options.map((step) => (
          <button key={step} type="button" className="chip sticker c-white" disabled={placed.includes(step)} onClick={() => choose(step)}>
            {step}
          </button>
        ))}
      </div>
      <Footer message={message} done={done} onDone={() => onDone(mistakes)} />
    </div>
  )
}

function Footer({ message, done, onDone }: { message: string; done: boolean; onDone: () => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-lg font-bold" role="status" aria-live="polite">
        {message}
      </p>
      <button type="button" className="cbtn c-yellow" disabled={!done} onClick={onDone}>
        {done ? 'Repair star! ⭐ Next →' : 'Finish the repair to continue'}
      </button>
    </div>
  )
}
