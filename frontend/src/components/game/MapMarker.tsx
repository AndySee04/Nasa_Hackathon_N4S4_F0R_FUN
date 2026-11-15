/**
 * A crayon mark on a mission map, drawn by hand rather than an emoji in a circle.
 * - Not found yet: signal rings on the Moon, an X on Mars ("dig here").
 * - Found: a coloured-in star; with all 3 stars it gets little shine lines.
 * Every mark has a dark outline under the colour so it shows up on both the pale Moon and orange Mars.
 */
export default function MapMarker({ kind, stars, bonus, selected }: { kind: 'signal' | 'dig'; stars: number; bonus: boolean; selected: boolean }) {
  const colour = bonus ? '#c8b6ff' : kind === 'dig' ? '#fff3d6' : '#ff9a3c'
  const ink = '#22203a'
  return (
    <svg viewBox="0 0 44 44" className={`h-full w-full overflow-visible ${stars > 0 ? '' : 'map-mark-new'}`} aria-hidden="true" style={{ filter: 'url(#crayon)' }}>
      {selected && <circle cx="22" cy="22" r="20" fill="none" stroke="#ffd447" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />}
      {stars > 0 ? (
        <g strokeLinejoin="round">
          <path d={STAR} fill="#ffd447" stroke={ink} strokeWidth="3" />
          {stars === 3 && (
            <g stroke="#fff3d6" strokeWidth="2.5" strokeLinecap="round">
              <path d="M35 8l3-3M38 15h4M30 4V0" />
            </g>
          )}
        </g>
      ) : kind === 'dig' ? (
        <g strokeLinecap="round">
          <path d="M13 12.5L31 31.5M31.5 12L12.5 31" stroke={ink} strokeWidth="9" />
          <path d="M13 12.5L31 31.5M31.5 12L12.5 31" stroke={colour} strokeWidth="5" />
        </g>
      ) : (
        <g fill="none" strokeLinecap="round">
          <circle cx="22" cy="22" r="13" stroke={ink} strokeWidth="7" />
          <circle cx="22" cy="22" r="13" stroke={colour} strokeWidth="3.5" strokeDasharray="20 5" />
          <circle cx="22" cy="22" r="5" fill={colour} stroke={ink} strokeWidth="2.5" />
        </g>
      )}
    </svg>
  )
}

/** A slightly lopsided five-point star, like one drawn by hand. */
const STAR = 'M22 5.5l4.6 10 10.6 1-8 7.3 2.5 10.6L22 29l-9.6 5.5 2.4-10.7-7.9-7.4 10.7-.9z'
