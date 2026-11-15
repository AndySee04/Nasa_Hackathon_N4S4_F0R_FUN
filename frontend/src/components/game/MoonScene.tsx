import type { MapPoint } from '../../game/moonMap'
import MapMarker from './MapMarker'
import PaintedWorld from './PaintedWorld'

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

/**
 * ym's painted Moon (its near side), with a pin for every mystery signal.
 * Pins are real buttons laid over the picture, so they work with a keyboard and screen readers.
 */
export default function MoonScene({ pins, selectedId, onSelectPin, onMoonClick, factsOpen }: Props) {
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
          <PaintedWorld id="moon" className="h-full w-full drop-shadow-[0_0_30px_rgba(247,243,232,0.25)]" />
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
              className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-yellow ${selected ? 'scale-125' : 'hover:scale-110'}`}
              style={{ left: `${pin.point.x}%`, top: `${pin.point.y}%` }}
            >
              <MapMarker kind="signal" stars={pin.stars} bonus={pin.bonus} selected={selected} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
