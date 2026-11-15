import type { ScenePin } from './MoonScene'
import MapMarker from './MapMarker'
import PaintedWorld from './PaintedWorld'

interface Props {
  pins: ScenePin[]
  selectedId: string | null
  onSelectPin: (id: string) => void
  onMarsClick: () => void
  factsOpen: boolean
}

/**
 * ym's painted Mars with a pin for every buried machine. The whole planet is squeezed onto one ball
 * (see projectMarsGlobe), so sites from every side of Mars fit.
 * Pins are real buttons laid over the picture, so they work with a keyboard and screen readers.
 */
export default function MarsScene({ pins, selectedId, onSelectPin, onMarsClick, factsOpen }: Props) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <button
        type="button"
        onClick={onMarsClick}
        aria-expanded={factsOpen}
        aria-controls="mars-facts"
        className="absolute inset-0 rounded-full focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-yellow"
        aria-label={factsOpen ? 'Hide Mars facts' : 'Tap Mars for Mars facts'}
      >
        <PaintedWorld id="mars" className="h-full w-full drop-shadow-[0_0_30px_rgba(224,138,79,0.3)]" />
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
            className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-yellow ${selected ? 'scale-125' : 'hover:scale-110'}`}
            style={{ left: `${pin.point.x}%`, top: `${pin.point.y}%` }}
          >
            <MapMarker kind="dig" stars={pin.stars} bonus={pin.bonus} selected={selected} />
          </button>
        )
      })}
    </div>
  )
}
