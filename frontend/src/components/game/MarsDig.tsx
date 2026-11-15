import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  canDig,
  COLS,
  dig,
  digLayout,
  dustDevil,
  earnedDigStar,
  HITS,
  isOpen,
  machineFound,
  ROWS,
  scan,
  SLACK,
  startDig,
  type Cell,
  type DigState,
} from '../../game/dig'
import type { CatcherSprite, DigClue } from '../../types/campaign'
import Paper from '../Paper'
import { MachineSprite } from './Sprites'

const GROUND_STYLE = {
  dust: { bg: '#f2c48d', name: 'dust' },
  sand: { bg: '#e08a4f', name: 'sand' },
  bedrock: { bg: '#a4472f', name: 'bedrock' },
  boulder: { bg: '#8d8a99', name: 'boulder' },
} as const

const LAYER_KEY = [
  { ground: 'dust', label: 'Dust', hits: 1 },
  { ground: 'sand', label: 'Sand', hits: 2 },
  { ground: 'bedrock', label: 'Bedrock', hits: 3 },
] as const

interface Props {
  artifactId: string
  attempt: number
  sprite: CatcherSprite
  clues: DigClue[]
  easy: boolean
  onFound: (star: boolean) => void
  onRetry: () => void
}

/**
 * Stage 2 on Mars: a pretend dig. Tunnel down through dust, sand and bedrock to uncover the machine,
 * collecting three true science clues on the way. Fully playable with a keyboard: arrows move, Enter digs.
 */
export default function MarsDig({ artifactId, attempt, sprite, clues, easy, onFound, onRetry }: Props) {
  const still = useReducedMotion()
  const layout = useMemo(() => digLayout(artifactId, attempt), [artifactId, attempt])
  const [state, setState] = useState<DigState>(() => startDig(layout, easy))
  const [scanMode, setScanMode] = useState(false)
  const [pings, setPings] = useState<Record<string, number>>({})
  const [message, setMessage] = useState('Tap a tile in the top row to start digging.')
  const [newClue, setNewClue] = useState<number | null>(null)
  const [focus, setFocus] = useState<Cell>({ col: 3, row: 0 })
  const gridRef = useRef<HTMLDivElement>(null)

  const found = machineFound(layout, state)
  const outOfEnergy = state.energy <= 0 && !found
  const k = (c: Cell) => `${c.col},${c.row}`
  const machineIndex = (c: Cell) => layout.machine.findIndex((m) => m.col === c.col && m.row === c.row)
  const clueIndex = (c: Cell) => layout.clues.findIndex((m) => m.col === c.col && m.row === c.row)

  function act(c: Cell) {
    if (found) return
    if (scanMode) {
      const r = scan(layout, state, c)
      if (!r) return
      setState(r.state)
      setPings((p) => ({ ...p, [k(c)]: r.distance }))
      setScanMode(false)
      setMessage(
        r.distance === 0
          ? 'Beep beep beep! The signal is right here!'
          : `Ping! The signal is ${r.distance} ${r.distance === 1 ? 'tile' : 'tiles'} away (counting up, down, left and right).`,
      )
      return
    }
    const r = dig(layout, state, c)
    setState(r.state)
    const e = r.event
    if (e.kind === 'blocked') {
      setMessage(
        e.reason === 'boulder'
          ? 'That boulder is too hard to break. Dig around it!'
          : e.reason === 'not-reachable'
            ? 'You can only dig the top row, or next to a tunnel you have already dug.'
            : 'That tile is already open.',
      )
    } else if (e.kind === 'no-energy') {
      setMessage('Your solar panels are out of energy!')
    } else if (e.kind === 'hit') {
      setMessage(`Crack! ${e.hitsLeft} more ${e.hitsLeft === 1 ? 'hit' : 'hits'} to break through.`)
    } else {
      if (e.clue !== undefined) {
        setNewClue(e.clue)
        setMessage(`Science clue found: ${clues[e.clue].label}!`)
      } else if (e.machineFound) {
        setMessage('You uncovered the whole machine!')
      } else if (e.machinePart) {
        setMessage('Metal! You found part of the machine. Uncover the rest of it.')
      } else {
        setMessage('Broke through!')
      }
    }
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const m = moves[e.key]
    if (!m) return
    e.preventDefault()
    const next = { col: Math.min(COLS - 1, Math.max(0, focus.col + m[0])), row: Math.min(ROWS - 1, Math.max(0, focus.row + m[1])) }
    setFocus(next)
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${k(next)}"]`)?.focus()
  }

  function cellLabel(c: Cell): string {
    const g = layout.ground[c.row][c.col]
    const where = `Row ${c.row + 1}, column ${c.col + 1}`
    const ping = pings[k(c)] !== undefined ? `, scanner said ${pings[k(c)]} away` : ''
    if (isOpen(state, c)) {
      if (machineIndex(c) >= 0) return `${where}: part of the machine`
      if (clueIndex(c) >= 0) return `${where}: clue, ${clues[clueIndex(c)].label}`
      return `${where}: open tunnel${ping}`
    }
    if (g === 'boulder') return `${where}: boulder, cannot be broken`
    const left = state.hitsLeft[c.row][c.col]
    return `${where}: ${GROUND_STYLE[g].name}, ${left} ${left === 1 ? 'hit' : 'hits'} left${canDig(layout, state, c) ? ', can dig' : ''}${ping}`
  }

  const energyMax = layout.bestCost + (easy ? SLACK.easy : SLACK.normal)
  const energyPct = Math.max(0, Math.min(100, (state.energy / Math.max(energyMax, state.energy)) * 100))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <Paper tone="cream" tilt={-0.3} innerClassName="p-4 sm:p-6">
        <p className="tape c-orange mb-3">🎮 Pretend dig · Mars simulator</p>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="min-w-40 flex-1">
            <p className="font-display" id="energy-label">
              🔋 Solar energy: {state.energy}
            </p>
            <div
              className="mt-1 h-4 overflow-hidden rounded-full border-2 border-ink/70 bg-sticker"
              role="meter"
              aria-labelledby="energy-label"
              aria-valuemin={0}
              aria-valuemax={Math.max(energyMax, state.energy)}
              aria-valuenow={state.energy}
            >
              <div className="h-full" style={{ width: `${energyPct}%`, background: energyPct > 30 ? '#7ccf9a' : '#f28b82' }} />
            </div>
          </div>
          <button
            type="button"
            className={`chip sticker ${scanMode ? 'c-yellow' : 'c-white'}`}
            aria-pressed={scanMode}
            disabled={state.scansLeft === 0 || found}
            onClick={() => {
              setScanMode((s) => !s)
              setMessage(scanMode ? 'Back to digging.' : 'Scanner on: tap any tile to measure how far the signal is.')
            }}
          >
            📡 Scanner ({state.scansLeft} left)
          </button>
        </div>

        {/* The sky strip above the ground. */}
        <div className="flex h-8 items-end justify-center rounded-t-md" style={{ background: '#f6d7b0' }} aria-hidden="true">
          <span className="text-sm text-ink-soft">surface of Mars</span>
        </div>
        <div
          ref={gridRef}
          role="grid"
          aria-label="Dig site. Use arrow keys to move and Enter to dig."
          onKeyDown={onKey}
          className="grid gap-1 rounded-b-md border-[3px] border-ink/80 p-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, background: '#5a2a1d' }}
        >
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => {
              const c = { col, row }
              const g = layout.ground[row][col]
              const open = isOpen(state, c)
              const mi = machineIndex(c)
              const ci = clueIndex(c)
              const left = state.hitsLeft[row][col]
              const diggable = canDig(layout, state, c)
              const ping = pings[k(c)]
              return (
                <button
                  key={k(c)}
                  type="button"
                  role="gridcell"
                  data-cell={k(c)}
                  tabIndex={focus.col === col && focus.row === row ? 0 : -1}
                  aria-label={cellLabel(c)}
                  onFocus={() => setFocus(c)}
                  onClick={() => act(c)}
                  className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-sm text-xl sm:text-2xl ${
                    diggable && !scanMode && !found ? 'ring-2 ring-yellow/80' : ''
                  }`}
                  style={{ background: open ? '#2a1712' : GROUND_STYLE[g].bg, minHeight: 40 }}
                >
                  {open && mi >= 0 && (
                    <span className="absolute inset-0 overflow-hidden" aria-hidden="true">
                      {/* Each tile shows its half of the machine. */}
                      <span className="absolute top-0 h-full w-[200%]" style={{ left: mi === 0 ? 0 : '-100%' }}>
                        <MachineSprite kind={sprite} className="h-full w-full" />
                      </span>
                    </span>
                  )}
                  {open && ci >= 0 && <span aria-hidden="true">{clues[ci].icon}</span>}
                  {!open && g === 'boulder' && <span aria-hidden="true">🪨</span>}
                  {!open && g !== 'boulder' && left < HITS[g] && (
                    <span aria-hidden="true" className="text-base text-ink/70">
                      {'⚡'.repeat(HITS[g] - left)}
                    </span>
                  )}
                  {ping !== undefined && (
                    <span aria-hidden="true" className="absolute right-0.5 top-0.5 rounded-full bg-sky px-1 text-xs font-bold text-ink">
                      {ping}
                    </span>
                  )}
                </button>
              )
            }),
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm" aria-label="Layers">
          {LAYER_KEY.map((l) => (
            <li key={l.ground} className="flex items-center gap-1">
              <span className="inline-block h-4 w-4 rounded-sm border border-ink/50" style={{ background: GROUND_STYLE[l.ground].bg }} />
              {l.label}: {l.hits} {l.hits === 1 ? 'hit' : 'hits'}
            </li>
          ))}
          <li>🪨 Boulder: can&apos;t break</li>
        </ul>
      </Paper>

      <div className="space-y-5">
        <Paper tone="yellow" tilt={0.5} innerClassName="p-5">
          <p className="text-lg font-bold" role="status" aria-live="polite">
            {message}
          </p>
          <p className="mt-2 text-sm">
            Every hit uses 1 energy. Dig smart: soft dust is cheap, bedrock is expensive. Find the machine{' '}
            <strong>without the dust devil</strong> to earn the dig star.
          </p>
          {outOfEnergy && (
            <div className="mt-4 flex flex-wrap gap-3">
              {!state.usedDustDevil ? (
                <button
                  type="button"
                  className="cbtn c-sky"
                  onClick={() => {
                    const s = dustDevil(state)
                    if (s) setState(s)
                    setMessage('Whoosh! A dust devil blew the dust off your solar panels. On real Mars this helped Spirit and Opportunity keep going!')
                  }}
                >
                  🌪️ Wait for a dust devil (+10 energy, no dig star)
                </button>
              ) : (
                <button type="button" className="cbtn c-yellow" onClick={onRetry}>
                  🔄 Try a new dig site
                </button>
              )}
            </div>
          )}
          {found && (
            <motion.div initial={still ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4">
              <p className="text-xl font-bold">
                {earnedDigStar(layout, state) ? '⭐ Dig star earned!' : 'Found it! (The dust devil helped, so no dig star this time.)'}
              </p>
              <button type="button" className="cbtn c-mint mt-3" onClick={() => onFound(earnedDigStar(layout, state))}>
                See what you found →
              </button>
            </motion.div>
          )}
        </Paper>

        <Paper tone="sky" tilt={-0.5} innerClassName="p-5">
          <h2 className="text-2xl">
            Science clues: {state.foundClues.length} / {clues.length}
          </h2>
          <p className="muted text-sm">Each clue is a true discovery this machine made.</p>
          <ul className="mt-3 space-y-2">
            {clues.map((clue, i) => {
              const have = state.foundClues.includes(i)
              // Once the machine is found, missed clues are shown too, so nobody misses the science.
              const show = have || found
              return (
                <motion.li
                  key={clue.label}
                  className={`rounded-md p-3 ${show ? 'bg-sticker' : 'bg-sticker/40'}`}
                  animate={newClue === i && !still ? { scale: [1, 1.05, 1] } : undefined}
                >
                  <p className="font-display">
                    <span aria-hidden="true">{show ? clue.icon : '❓'}</span> {show ? clue.label : 'Hidden clue'}
                    {show && !have && <span className="text-sm font-normal"> (you dug past this one)</span>}
                  </p>
                  {show && <p className="mt-1">{clue.fact}</p>}
                </motion.li>
              )
            })}
          </ul>
        </Paper>
      </div>
    </div>
  )
}
