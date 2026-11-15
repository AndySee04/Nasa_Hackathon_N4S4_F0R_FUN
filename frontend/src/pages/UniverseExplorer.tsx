import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Paper from '../components/Paper'
import { BODIES, bodyById, MOON_BODY } from '../data/planets'
import { useAstro } from '../hooks/useAstro'
import { usePageContext } from '../hooks/usePageContext'
import { crayonPlanetImage, mountCrayonSky, type SkyHandle } from '../lib/crayonSky'

const LIST = [...BODIES.slice(0, 4), MOON_BODY, ...BODIES.slice(4)]

/** Height kept free at the bottom of the drawing for the row of worlds. */
const PICKER_H = 68
/** Below this width the fact card sits under the planet instead of beside it. */
const SIDE_CARD_MIN = 768

/**
 * The solar system explorer fits on one screen: the drawing fills it, the worlds sit in a row along the bottom,
 * and a chosen world's card floats beside it (under it on phones), so a child never scrolls to read about the
 * planet they just tapped.
 */
export default function UniverseExplorer() {
  usePageContext('explore')
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('body')
  const body = bodyById(selectedId)
  const { open } = useAstro()
  const still = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const skyRef = useRef<SkyHandle | null>(null)
  /** Small pictures of every world, for the row of worlds. */
  const pictures = useMemo(() => Object.fromEntries(LIST.map((b) => [b.id, crayonPlanetImage(b.id, b.rings ? 26 : 40)])), [])

  const selectRef = useRef((id: string | null) => {
    setParams(id ? { body: id } : {}, { replace: true })
  })
  useEffect(() => {
    selectRef.current = (id) => setParams(id ? { body: id } : {}, { replace: true })
  }, [setParams])

  useEffect(() => {
    const narrow = () => window.innerWidth < SIDE_CARD_MIN
    const sky = mountCrayonSky(canvasRef.current!, {
      center: [0.5, 0.47],
      fill: narrow() ? 0.95 : 0.8,
      tilt: 0.42,
      // The chosen world flies to the open space next to its card and the camera follows it round its orbit.
      focus: (_b, w, h) => {
        const card = cardRef.current
        const title = titleRef.current
        const top = title ? title.offsetTop + title.offsetHeight + 8 : 72 // under the title
        if (narrow()) {
          const room = Math.max(140, h - PICKER_H - (card?.offsetHeight || h * 0.5) - top)
          return {
            x: w / 2,
            y: top + room / 2,
            r: Math.min(w * 0.3, room * 0.42),
          }
        }
        const free = w - (card?.offsetWidth || 360) - 24
        const room = h - PICKER_H - top
        return {
          x: free / 2,
          y: top + room / 2,
          r: Math.min(free * 0.3, room * 0.42),
        }
      },
      onSelect: (b) => selectRef.current(b?.id ?? null),
    })
    skyRef.current = sky
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && selectRef.current(null)
    window.addEventListener('keydown', onKey)
    return () => {
      sky.destroy()
      skyRef.current = null
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Keep the drawing in step with the URL (choosing from the row, or opening a shared link).
  useEffect(() => {
    skyRef.current?.select(body ? body.id : null)
  }, [body])

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-6">
      <div className="relative h-[calc(100dvh-6.5rem)] min-h-[30rem] overflow-hidden rounded-[34px_28px_36px_26px/28px_36px_26px_34px] border-[3px] border-dashed border-chalk/35 bg-night-deep/60 sm:h-[calc(100dvh-8.25rem)]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-grab touch-pan-y"
          aria-label="A crayon drawing of the solar system. Drag sideways to spin it, tap a world to fly in close. You can also choose a world from the row at the bottom."
        />

        {/* The title, small, so the drawing gets the room. The how-to line goes once a world is chosen. */}
        <div ref={titleRef} className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] sm:left-5 sm:top-5 sm:max-w-[30rem]">
          <Paper tilt={-1} innerClassName="px-4 py-2.5">
            <p className="tape -ml-1 mb-1.5 text-sm">Module A · Solar System Explorer</p>
            <h1 className="text-2xl leading-tight sm:text-3xl">Explore the Universe</h1>
            {!body && (
              <p className="mt-1 text-sm leading-snug sm:text-base">
                Drag to spin it. Tap a world to fly in close.
                <span className="muted hidden sm:inline"> Sizes and distances are squashed so everything fits.</span>
              </p>
            )}
          </Paper>
        </div>

        <div
          ref={cardRef}
          // Phones: under the planet, leaving room above for the title and the planet. Wider: beside it, on the right.
          // Long cards scroll inside themselves, never the page.
          className="pointer-events-none absolute inset-x-2 max-h-[calc(100%-68px-15rem)] overflow-y-auto overscroll-contain p-1 *:pointer-events-auto md:inset-x-auto md:right-4 md:top-4 md:max-h-[calc(100%-68px-1rem)] md:w-[22rem]"
          style={{ bottom: PICKER_H }}
        >
          <AnimatePresence mode="wait">
            {body && (
              <motion.div
                key={body.id}
                initial={still ? { opacity: 0 } : { opacity: 0, y: 16, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={still ? { opacity: 0 } : { opacity: 0, y: 12 }}
                transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                aria-live="polite"
              >
                <Paper as="section" tilt={-0.6} aria-labelledby="world-name" innerClassName="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="world-name" className="text-2xl sm:text-3xl">
                      {body.name}
                    </h2>
                    <button type="button" onClick={() => selectRef.current(null)} className="sticker c-white btn btn-sm h-10 w-10 shrink-0 p-0!">
                      <span aria-hidden="true">✕</span>
                      <span className="sr-only">Back to the whole solar system</span>
                    </button>
                  </div>
                  <p className="leading-relaxed sm:text-lg">{body.description}</p>
                  <div className="rounded-md bg-yellow/35 px-3.5 py-2.5">
                    <h3 className="font-display">What we left there</h3>
                    <p className="mt-0.5 text-sm sm:text-base">{body.hardware}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {body.archive && (
                      <Link to={body.archive.to} className="cbtn c-pink">
                        {body.archive.label}
                      </Link>
                    )}
                    <button type="button" className="sticker c-white btn btn-sm" onClick={() => open(`Tell me a cool fact about ${body.name}.`)}>
                      Ask Astro about {body.name}
                    </button>
                  </div>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Every world in one row along the bottom, always in reach. On phones it slides sideways. */}
        <div
          className="chip-row absolute inset-x-0 bottom-0 flex items-center gap-2 overflow-x-auto px-3 md:[justify-content:safe_center]"
          style={{ height: PICKER_H }}
          role="group"
          aria-label="Choose a world"
        >
          {LIST.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={selectedId === b.id}
              onClick={() => selectRef.current(selectedId === b.id ? null : b.id)}
              className="chip sticker c-white shrink-0 whitespace-nowrap pl-1.5"
            >
              <img src={pictures[b.id]} alt="" className="h-6 w-6 object-contain" />
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
