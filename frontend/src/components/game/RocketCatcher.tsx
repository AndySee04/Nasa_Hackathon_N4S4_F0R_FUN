import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { CLAW_MAX, CLAW_MIN, CLAW_STEP, clampClaw, drop, HINT_AFTER_MISSES, hintFor, layoutFor } from '../../game/catcher'
import type { CatcherSprite } from '../../types/campaign'
import { MachineSprite, MoonRock, RocketClaw } from './Sprites'

type Phase = 'aim' | 'dropping' | 'grabbed' | 'lifting' | 'returning'

interface Props {
  artifactId: string
  /** Changes the layout on "Play again" so it isn't the same every time. */
  attempt?: number
  sprite: CatcherSprite
  easy: boolean
  onCaught: () => void
}

const START_X = 50
const TOP = 3 // percent from the top while aiming
const BOTTOM = 46 // percent from the top when the claw reaches the ground

/**
 * Stage 2: steer the rocket claw over the signal and drop it.
 * Mouse/touch: drag or tap to move, then DROP. Keyboard: ← → to move, Space or Enter to drop.
 */
export default function RocketCatcher({ artifactId, attempt = 0, sprite, easy, onCaught }: Props) {
  const still = useReducedMotion()
  const speed = still ? 0.15 : 1
  const [misses, setMisses] = useState(0)
  const layout = useMemo(() => layoutFor(artifactId, attempt), [artifactId, attempt])
  const [x, setX] = useState(START_X)
  const [phase, setPhase] = useState<Phase>('aim')
  const [message, setMessage] = useState('Move the rocket claw over the signal, then drop it!')
  const areaRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms * speed))

  const aiming = phase === 'aim'
  const hint = hintFor(x, layout, easy)
  const showHint = aiming && (easy || misses >= HINT_AFTER_MISSES)

  function move(to: number) {
    if (aiming) setX(clampClaw(to))
  }

  function release() {
    if (!aiming) return
    const result = drop(x, layout, easy)
    setPhase('dropping')
    setMessage('Dropping the claw…')
    later(750, () => {
      if (result.kind === 'catch') {
        setX(result.snapTo)
        setPhase('grabbed')
        setMessage('Got it! Lifting it up…')
        later(350, () => setPhase('lifting'))
        later(1300, onCaught)
        return
      }
      setMessage(result.kind === 'rock' ? 'That is just a moon rock! Try again.' : 'Only moon dust here. Try again!')
      setMisses((m) => m + 1)
      setPhase('returning')
      later(700, () => setPhase('aim'))
    })
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      move(x + (e.key === 'ArrowLeft' ? -CLAW_STEP : CLAW_STEP))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      move(e.key === 'Home' ? CLAW_MIN : CLAW_MAX)
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      release()
    }
  }

  function pointerX(e: PointerEvent) {
    const box = areaRef.current?.getBoundingClientRect()
    return box ? ((e.clientX - box.left) / box.width) * 100 : x
  }

  const clawTop = phase === 'dropping' || phase === 'grabbed' ? BOTTOM : TOP
  const carrying = phase === 'grabbed' || phase === 'lifting'
  const clawTransition = { duration: (phase === 'dropping' ? 0.7 : 0.6) * speed, ease: 'easeInOut' as const }

  return (
    <div>
      <div
        ref={areaRef}
        role="slider"
        tabIndex={0}
        aria-label="Rocket claw position. Use the left and right arrow keys, then press Space to drop."
        aria-valuemin={CLAW_MIN}
        aria-valuemax={CLAW_MAX}
        aria-valuenow={Math.round(x)}
        aria-valuetext={hint}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          dragging.current = true
          areaRef.current?.focus()
          move(pointerX(e))
        }}
        onPointerMove={(e) => dragging.current && move(pointerX(e))}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
        className="relative aspect-[16/11] w-full cursor-pointer touch-none select-none overflow-hidden rounded-[28px_22px_30px_24px] border-4 border-sticker bg-night-deep focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-yellow sm:aspect-[16/9]"
      >
        {/* Earth in the sky, and the grey ground. */}
        <span className="absolute right-[6%] top-[8%] text-4xl sm:text-5xl" aria-hidden="true">
          🌍
        </span>
        <div className="absolute inset-x-0 bottom-0 h-[30%] rounded-t-[50%_20px] bg-[#b9b6c4]" aria-hidden="true">
          <span className="absolute left-[18%] top-[30%] h-3 w-10 rounded-full bg-[#9a98a6]" />
          <span className="absolute left-[58%] top-[55%] h-2 w-8 rounded-full bg-[#9a98a6]" />
        </div>

        {layout.rocks.map((r) => (
          <div key={r} className="absolute bottom-[12%] w-[12%] -translate-x-1/2 sm:w-[9%]" style={{ left: `${r}%` }} aria-hidden="true">
            <MoonRock className="w-full" />
          </div>
        ))}

        {!carrying && (
          <div className={`absolute bottom-[11%] -translate-x-1/2 ${sprite === 'lander-rover' ? 'w-[30%] sm:w-[24%]' : 'w-[22%] sm:w-[17%]'}`} style={{ left: `${layout.target}%` }} aria-hidden="true">
            <MachineSprite kind={sprite} className="w-full" />
            {showHint && !still && <span className="absolute -inset-3 animate-ping rounded-full border-4 border-yellow/60" />}
          </div>
        )}

        {/* Dashed line from the rocket down to the ground, to help aim. */}
        {aiming && (
          <span
            className="absolute bottom-[18%] top-[22%] w-0 -translate-x-1/2 border-l-[3px] border-dashed border-chalk/40"
            style={{ left: `${x}%` }}
            aria-hidden="true"
          />
        )}

        <motion.div
          className="absolute w-[17%] -translate-x-1/2 sm:w-[13%]"
          style={{ left: `${x}%` }}
          initial={false}
          animate={{ top: phase === 'lifting' ? '-60%' : `${clawTop}%` }}
          transition={phase === 'lifting' ? { duration: 0.9 * speed, ease: 'easeIn' } : clawTransition}
          aria-hidden="true"
        >
          <RocketClaw open={!carrying} className="w-full" />
          {carrying && (
            <div className="-mt-[18%] w-[130%] -translate-x-[11%]">
              <MachineSprite kind={sprite} className="w-full" />
            </div>
          )}
        </motion.div>
      </div>

      <p className="mt-4 min-h-[1.5em] text-center text-lg font-bold text-chalk" role="status" aria-live="polite">
        {message}
      </p>
      {showHint && <p className="text-center text-yellow">💡 {hint}</p>}

      <div className="mt-4 flex items-center justify-center gap-3">
        <button type="button" className="cbtn c-sky" aria-label="Move left" disabled={!aiming} onClick={() => move(x - CLAW_STEP * 2)}>
          ◀
        </button>
        <button type="button" className="cbtn c-yellow px-10 text-xl" disabled={!aiming} onClick={release}>
          DROP!
        </button>
        <button type="button" className="cbtn c-sky" aria-label="Move right" disabled={!aiming} onClick={() => move(x + CLAW_STEP * 2)}>
          ▶
        </button>
      </div>
    </div>
  )
}
