import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  MAX_SOLS,
  OUTCOME_TEXT,
  parseLevel,
  restingPlace,
  shortestSolution,
  simulate,
  VEHICLE_WORDS,
  type Command,
  type DriveLevel,
  type Outcome,
  type Pos,
} from '../../game/drive'
import type { CatcherSprite } from '../../types/campaign'
import { useBringIntoView } from '../../hooks/useBringIntoView'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import Paper from '../Paper'
import { MachineSprite } from './Sprites'

const ROTATE = { N: -90, E: 0, S: 90, W: 180 } as const
const DIR_WORD = { N: 'up', E: 'right', S: 'down', W: 'left' } as const
const CMD_ICON: Record<Command, string> = { F: '⬆️', L: '↺', R: '↻' }
const CMD_WORD: Record<Command, string> = { F: 'forward', L: 'turn left', R: 'turn right' }

type Phase = 'plan' | 'uplink' | 'driving' | 'arrived'

interface Props {
  level: DriveLevel
  sprite: CatcherSprite
  easy: boolean
  onDone: (star: boolean) => void
}

/**
 * Stage 4 on Mars: plan a list of moves, send it, then watch what happens. Like real rover drivers,
 * you can't steer live because signals take minutes to reach Mars. Each send is one sol (Mars day).
 */
export default function RoverDrive({ level, sprite, easy, onDone }: Props) {
  const still = useReducedMotion()
  const { width, height, start, target } = parseLevel(level)
  const words = VEHICLE_WORDS[level.vehicle]
  const [pos, setPos] = useState<Pos>(start)
  const [plan, setPlan] = useState<Command[]>([])
  const [phase, setPhase] = useState<Phase>('plan')
  const arrivedRef = useBringIntoView<HTMLDivElement>(phase === 'arrived')
  const wide = useMediaQuery('(min-width: 64rem)')
  const [sols, setSols] = useState(0)
  const [trail, setTrail] = useState<Pos[]>([start])
  const [shown, setShown] = useState<Pos>(start)
  const [result, setResult] = useState<Outcome | null>(null)
  const [hint, setHint] = useState<Command[] | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const preview = easy && phase === 'plan' ? simulate(level, plan, pos).path : []
  const full = plan.length >= level.maxCommands

  function add(c: Command) {
    if (phase !== 'plan' || full) return
    setPlan((p) => [...p, c])
    setResult(null)
  }

  function send() {
    if (phase !== 'plan' || plan.length === 0) return
    const run = simulate(level, plan, pos)
    const sol = sols + 1
    setSols(sol)
    setHint(null)
    setPhase('uplink')
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, still ? 0 : ms))
    const stepMs = 380
    later(1600, () => {
      setPhase('driving')
      run.path.forEach((p, i) => later(i * stepMs, () => setShown(p)))
      later(run.path.length * stepMs + 200, () => {
        const rest = restingPlace(run.path, run.outcome)
        setTrail((t) => [...t, ...run.path.slice(1)])
        setPos(rest)
        setShown(rest)
        setResult(run.outcome)
        setPlan([])
        setPhase(run.outcome === 'arrived' ? 'arrived' : 'plan')
      })
    })
  }

  const isAt = (p: { x: number; y: number }, x: number, y: number) => p.x === x && p.y === y
  const visited = (x: number, y: number) => trail.some((p) => isAt(p, x, y))
  const inPreview = (x: number, y: number) => preview.some((p) => isAt(p, x, y))
  const star = sols <= MAX_SOLS

  function tileLabel(x: number, y: number): string {
    const ch = level.map[y][x]
    const what =
      ch === '#'
        ? level.vehicle === 'helicopter'
          ? 'rock (you can fly over it)'
          : 'rock'
        : ch === '~'
          ? level.vehicle === 'helicopter'
            ? 'smooth sand ripples'
            : 'soft sand'
          : ch === 'T'
            ? `target: ${level.targetLabel}`
            : 'open ground'
    const here = isAt(shown, x, y) ? `, ${words.name} here facing ${DIR_WORD[shown.dir]}` : ''
    return `Row ${y + 1}, column ${x + 1}: ${what}${here}`
  }

  /** Moves, plan and send. Under the map on phones, in the side panel on wider screens. */
  const controls = (
    <>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Add a move">
        {(['F', 'L', 'R'] as Command[]).map((c) => (
          <button key={c} type="button" className="chip sticker c-white" disabled={phase !== 'plan' || full} onClick={() => add(c)}>
            <span aria-hidden="true">{CMD_ICON[c]}</span> {c === 'F' ? words.forward : CMD_WORD[c][0].toUpperCase() + CMD_WORD[c].slice(1)}
          </button>
        ))}
      </div>

      <p className="mt-4 font-display">
        Plan ({plan.length} / {level.maxCommands}):
      </p>
      <ol className="mt-1 flex min-h-11 flex-wrap gap-1 rounded-md bg-sticker/70 p-2" aria-label="Your plan">
        {plan.length === 0 && <li className="text-ink-soft">No moves yet</li>}
        {plan.map((c, i) => (
          <li key={i} className="label c-sky px-2" aria-label={`${i + 1}: ${CMD_WORD[c]}`}>
            {CMD_ICON[c]}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="chip sticker c-white"
          disabled={phase !== 'plan' || plan.length === 0}
          onClick={() => setPlan((p) => p.slice(0, -1))}
        >
          ⌫ Undo
        </button>
        <button type="button" className="chip sticker c-white" disabled={phase !== 'plan' || plan.length === 0} onClick={() => setPlan([])}>
          Clear
        </button>
        <button type="button" className="cbtn c-orange" disabled={phase !== 'plan' || plan.length === 0} onClick={send}>
          📡 {words.send}
        </button>
      </div>
    </>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Paper tone="cream" tilt={0.3} innerClassName="p-3 sm:p-4">
        {/* One short row above the map, so the whole map fits on screen under it. */}
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="tape c-orange">🎮 Pretend mission · {words.name} simulator</p>
          <p>
            Goal: reach <strong>{level.targetLabel}</strong> <span aria-hidden="true">🎯</span>
          </p>
        </div>
        <div
          role="grid"
          aria-label={`Map. The ${words.name} is at row ${shown.y + 1}, column ${shown.x + 1}, facing ${DIR_WORD[shown.dir]}.`}
          className="mx-auto grid gap-1 rounded-md border-[3px] border-ink/80 p-1"
          // Never taller than the screen leaves room for, so the whole map is in view while planning.
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            background: '#7a3a24',
            maxWidth: `max(18rem, calc((100dvh - 24rem) * ${width / height}))`,
          }}
        >
          {Array.from({ length: height }, (_, y) =>
            Array.from({ length: width }, (_, x) => {
              const ch = level.map[y][x]
              const here = isAt(shown, x, y)
              return (
                <div
                  key={`${x},${y}`}
                  role="gridcell"
                  aria-label={tileLabel(x, y)}
                  className={`relative flex aspect-square items-center justify-center rounded-sm text-xl sm:text-2xl ${
                    inPreview(x, y) && !here ? 'ring-2 ring-sky' : ''
                  }`}
                  style={{
                    background:
                      ch === '~' ? 'repeating-linear-gradient(160deg,#f2c48d 0 6px,#e9b277 6px 12px)' : visited(x, y) ? '#c9734a' : '#d98a5c',
                  }}
                >
                  {ch === '#' && <span aria-hidden="true">🪨</span>}
                  {ch === 'T' && !here && <span aria-hidden="true">🎯</span>}
                  {here && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-1 flex items-center justify-center transition-transform"
                      style={{ transform: `rotate(${ROTATE[shown.dir]}deg)` }}
                    >
                      <MachineSprite kind={sprite} className="h-full w-full" />
                      <span className="absolute -right-1 text-sm">▶</span>
                    </span>
                  )}
                </div>
              )
            }),
          )}
        </div>
        {easy && <p className="mt-2 text-sm text-ink-soft">Easy mode: blue outlines show where your plan will go.</p>}

        {/* Phones: the moves sit right under the map, so you plan while looking at it. */}
        {!wide && controls}
      </Paper>

      <div className="space-y-5">
        <Paper tone="yellow" tilt={-0.5} innerClassName="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl">Sol {Math.min(sols + (phase === 'plan' ? 1 : 0), 99)}</h2>
            <span className={`label ${sols < MAX_SOLS || phase === 'arrived' ? 'c-mint' : 'c-pink'}`}>
              Arrive within {MAX_SOLS} sols for the star
            </span>
          </div>
          {wide && controls}

          <div className="mt-4" role="status" aria-live="polite">
            {phase === 'uplink' && <p className="text-lg font-bold">📡 Sending to Mars… (in real life this takes minutes!)</p>}
            {phase === 'driving' && <p className="text-lg font-bold">The {words.name} is following your plan…</p>}
            {phase !== 'uplink' && phase !== 'driving' && result && <p className="text-lg font-bold">{OUTCOME_TEXT[level.vehicle][result]}</p>}
          </div>

          {phase === 'plan' && sols >= MAX_SOLS && (
            <div className="mt-3">
              {hint ? (
                <p>
                  Hint: try starting with{' '}
                  <strong>
                    {hint
                      .slice(0, 4)
                      .map((c) => CMD_WORD[c])
                      .join(', ')}
                  </strong>
                  .
                </p>
              ) : (
                <button type="button" className="link" onClick={() => setHint(shortestSolution(level, pos))}>
                  Need a hint?
                </button>
              )}
            </div>
          )}

          {phase === 'arrived' && (
            <div ref={arrivedRef} className="mt-4 scroll-mb-4">
              <p className="text-xl font-bold">
                {star
                  ? `⭐ Drive star earned! You made it in ${sols} ${sols === 1 ? 'sol' : 'sols'}.`
                  : `You made it in ${sols} sols. Arrive within ${MAX_SOLS} for the star next time!`}
              </p>
              <button type="button" className="cbtn c-mint mt-3" onClick={() => onDone(star)}>
                Read the real story →
              </button>
            </div>
          )}
          <ul className="mt-4 space-y-1 border-t-2 border-dashed border-ink/20 pt-3 text-sm">
            <li>📡 Signals take 4 to 22 minutes to reach Mars, so you can&apos;t steer live.</li>
            <li>📝 Plan up to {level.maxCommands} moves, then send them all at once.</li>
            <li>☀️ Each send takes one sol (one Mars day).</li>
          </ul>
        </Paper>
        <p className="text-sm text-dusk">
          Target is at row {target.y + 1}, column {target.x + 1}. 🪨 rocks
          {level.vehicle === 'helicopter' ? ' are fine to fly over; avoid the smooth sand ripples.' : ' and soft sand will stop you.'}
        </p>
      </div>
    </div>
  )
}
