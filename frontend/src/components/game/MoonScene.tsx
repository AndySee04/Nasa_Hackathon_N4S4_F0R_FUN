import { useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import type { MapPoint } from '../../game/moonMap'

export interface ScenePin {
  id: string
  label: string
  point: MapPoint
  stars: number
  bonus: boolean
}

interface Props {
  pins: ScenePin[]
  selectedId: string | null
  onSelectPin: (id: string) => void
  onMoonClick: () => void
  factsOpen: boolean
}

/** Maria (dark lava plains) drawn roughly where they are on the real near side. Decorative only. */
const MARIA = [
  { cx: 38, cy: 33, rx: 15, ry: 11 }, // Mare Imbrium
  { cx: 62, cy: 34, rx: 8, ry: 7 }, // Mare Serenitatis
  { cx: 69, cy: 50, rx: 10, ry: 8 }, // Mare Tranquillitatis
  { cx: 25, cy: 50, rx: 13, ry: 17 }, // Oceanus Procellarum
  { cx: 80, cy: 38, rx: 5, ry: 5 }, // Mare Crisium
  { cx: 73, cy: 64, rx: 7, ry: 6 }, // Mare Fecunditatis
  { cx: 38, cy: 63, rx: 8, ry: 6 }, // Mare Nubium
]
const CRATERS = [
  { cx: 43, cy: 86, r: 3.2 }, // Tycho
  { cx: 41, cy: 46, r: 2.4 }, // Copernicus
  { cx: 55, cy: 74, r: 2 },
  { cx: 84, cy: 70, r: 1.6 },
  { cx: 18, cy: 30, r: 1.8 },
  { cx: 60, cy: 18, r: 1.5 },
]

/**
 * The Moon's near side in crayon, with a pin for every mystery signal.
 * Pins are real buttons laid over the picture, so they work with a keyboard and screen readers.
 */
export default function MoonScene({ pins, selectedId, onSelectPin, onMoonClick, factsOpen }: Props) {
  const still = useReducedMotion()
  const grain = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 61) % 100, o: 0.08 + ((i * 13) % 10) / 100 })).filter(
        (g) => Math.hypot(g.x - 50, g.y - 50) < 46,
      ),
    [],
  )

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      {/* The Moon stays still on purpose: pins that move are hard for small hands to tap. */}
      <div className="absolute inset-0">
        <button
          type="button"
          onClick={onMoonClick}
          aria-expanded={factsOpen}
          aria-controls="moon-facts"
          className="absolute inset-0 rounded-full focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-yellow"
          aria-label={factsOpen ? 'Hide Moon facts' : 'Tap the Moon for Moon facts'}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_30px_rgba(247,243,232,0.25)]" aria-hidden="true">
            <defs>
              <radialGradient id="moon-shade" cx="40%" cy="38%" r="70%">
                <stop offset="0%" stopColor="#f2f0ea" />
                <stop offset="70%" stopColor="#cfcdd6" />
                <stop offset="100%" stopColor="#9a98a6" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="49" fill="url(#moon-shade)" stroke="#22203a" strokeWidth="1.2" />
            {MARIA.map((m, i) => (
              <ellipse key={i} {...m} fill="#8f8c9e" opacity="0.55" />
            ))}
            {grain.map((g, i) => (
              <circle key={i} cx={g.x} cy={g.y} r="0.5" fill="#22203a" opacity={g.o} />
            ))}
            {CRATERS.map((c, i) => (
              <g key={i}>
                <circle cx={c.cx} cy={c.cy} r={c.r} fill="#b9b6c4" stroke="#7d7a8c" strokeWidth="0.5" />
                <circle cx={c.cx - c.r * 0.2} cy={c.cy - c.r * 0.2} r={c.r * 0.55} fill="#a7a4b4" />
              </g>
            ))}
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
              aria-label={`${found ? pin.label : 'Mystery signal'}${pin.bonus ? ' (bonus)' : ''}: ${pin.stars} of 3 stars`}
              className={`sticker absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg ${
                selected ? 'c-yellow scale-125' : pin.bonus ? 'c-lilac' : found ? 'c-mint' : 'c-orange'
              } transition-transform`}
              style={{ left: `${pin.point.x}%`, top: `${pin.point.y}%` }}
            >
              <span aria-hidden="true">{found ? '⭐' : '📡'}</span>
              {!found && !still && (
                <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border-4 border-orange/70" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
