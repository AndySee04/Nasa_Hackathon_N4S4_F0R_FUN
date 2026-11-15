import { useReducedMotion } from 'framer-motion'
import type { ScenePin } from './MoonScene'

interface Props {
  pins: ScenePin[]
  selectedId: string | null
  onSelectPin: (id: string) => void
  onMarsClick: () => void
  factsOpen: boolean
}

/** Big real features, drawn roughly where they are. Decorative only. */
const DARK = [
  { cx: 69, cy: 45, rx: 6, ry: 9 }, // Syrtis Major
  { cx: 52, cy: 52, rx: 12, ry: 5 }, // Meridiani / Sinus Sabaeus
  { cx: 85, cy: 40, rx: 8, ry: 5 },
  { cx: 28, cy: 70, rx: 14, ry: 6 },
]
const VOLCANOES = [
  { cx: 12.8, cy: 39.6, r: 3.2, name: 'Olympus Mons' },
  { cx: 21, cy: 45, r: 1.6, name: '' },
  { cx: 22.5, cy: 50, r: 1.6, name: '' },
  { cx: 19.5, cy: 41, r: 1.6, name: '' },
]

/**
 * A flat crayon map of Mars with a pin for every buried machine.
 * Pins are real buttons laid over the picture, so they work with a keyboard and screen readers.
 */
export default function MarsScene({ pins, selectedId, onSelectPin, onMarsClick, factsOpen }: Props) {
  const still = useReducedMotion()
  return (
    <div className="relative mx-auto aspect-[2/1] w-full max-w-[720px]">
      <button
        type="button"
        onClick={onMarsClick}
        aria-expanded={factsOpen}
        aria-controls="mars-facts"
        className="absolute inset-0 rounded-[1.5rem] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-yellow"
        aria-label={factsOpen ? 'Hide Mars facts' : 'Tap Mars for Mars facts'}
      >
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_0_30px_rgba(224,138,79,0.3)]" aria-hidden="true">
          <defs>
            <linearGradient id="mars-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9774b" />
              <stop offset="50%" stopColor="#e08a4f" />
              <stop offset="100%" stopColor="#c8643b" />
            </linearGradient>
          </defs>
          <rect x="0.5" y="0.5" width="99" height="49" rx="6" fill="url(#mars-shade)" stroke="#22203a" strokeWidth="0.6" />
          {DARK.map((d, i) => (
            <ellipse key={i} cx={d.cx} cy={d.cy / 2} rx={d.rx} ry={d.ry / 2} fill="#8f3f27" opacity="0.45" />
          ))}
          {/* Valles Marineris, the giant canyon. */}
          <path d="M22 27 C27 26.5, 33 28.5, 39 27.5" stroke="#6e2c1b" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          {VOLCANOES.map((v, i) => (
            <ellipse key={i} cx={v.cx} cy={v.cy / 2} rx={v.r} ry={v.r / 2} fill="#c76e45" stroke="#7a3a24" strokeWidth="0.35" />
          ))}
          {/* Hellas, a huge impact basin. */}
          <ellipse cx="69.4" cy="36.5" rx="5" ry="2.6" fill="#efb07f" opacity="0.7" />
          {/* Ice caps. */}
          <path d="M30 1.2 Q50 6 70 1.2 Z" fill="#f7f3e8" opacity="0.9" />
          <path d="M38 48.8 Q50 45 62 48.8 Z" fill="#f7f3e8" opacity="0.9" />
        </svg>
      </button>

      {pins.map((pin) => {
        const found = pin.stars > 0
        const selected = pin.id === selectedId
        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => onSelectPin(pin.id)}
            aria-pressed={selected}
            aria-label={`${found ? pin.label : 'Buried signal'}${pin.bonus ? ' (bonus)' : ''}: ${pin.stars} of 3 stars`}
            className={`sticker absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg ${
              selected ? 'c-yellow scale-125' : pin.bonus ? 'c-lilac' : found ? 'c-mint' : 'c-orange'
            } transition-transform`}
            style={{ left: `${pin.point.x}%`, top: `${pin.point.y}%` }}
          >
            <span aria-hidden="true">{pin.stars === 3 ? '🌟' : found ? '⭐' : '⛏️'}</span>
            {!found && !still && (
              <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border-4 border-orange/70" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}
