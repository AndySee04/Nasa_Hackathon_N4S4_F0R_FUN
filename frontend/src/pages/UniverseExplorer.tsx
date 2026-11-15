import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import { BODIES, bodyById, MOON_BODY } from '../data/planets'
import { useAstro } from '../hooks/useAstro'
import { usePageContext } from '../hooks/usePageContext'
import { crayonPlanetImage, mountCrayonSky, type SkyHandle } from '../lib/crayonSky'

const LIST = [...BODIES.slice(0, 4), MOON_BODY, ...BODIES.slice(4)]

export default function UniverseExplorer() {
  usePageContext('explore')
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('body')
  const body = bodyById(selectedId)
  const { open } = useAstro()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const skyRef = useRef<SkyHandle | null>(null)
  /** Small crayon drawings of every world, for the picker and the fact card. */
  const pictures = useMemo(() => Object.fromEntries(LIST.map((b) => [b.id, crayonPlanetImage(b.id, b.rings ? 26 : 40)])), [])

  const selectRef = useRef((id: string | null) => {
    setParams(id ? { body: id } : {}, { replace: true })
  })
  useEffect(() => {
    selectRef.current = (id) => setParams(id ? { body: id } : {}, { replace: true })
  }, [setParams])

  useEffect(() => {
    const sky = mountCrayonSky(canvasRef.current!, {
      center: [0.5, 0.5],
      fill: 0.8,
      tilt: 0.42,
      // The chosen world flies to the middle and the camera follows it round its orbit.
      focus: (_b, w, h) => ({ x: w / 2, y: h / 2, r: Math.min(w, h) * 0.3 }),
      onSelect: (b) => selectRef.current(b?.id ?? null),
    })
    skyRef.current = sky
    return () => {
      sky.destroy()
      skyRef.current = null
    }
  }, [])

  // Keep the drawing in step with the URL (choosing from the list, or opening a shared link).
  useEffect(() => {
    skyRef.current?.select(body ? body.id : null)
  }, [body])

  return (
    <>
      <PageHeader eyebrow="Module A · Solar System Explorer" title="Explore the Universe">
        Drag sideways to spin the solar system and tap any world to fly in close. Sizes and distances are squashed so
        everything fits: the real solar system is mostly empty space!
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[62vh] min-h-[400px] overflow-hidden rounded-[34px_28px_36px_26px/28px_36px_26px_34px] border-[3px] border-dashed border-chalk/35 bg-night-deep/60">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-grab touch-pan-y"
            aria-label="A crayon drawing of the solar system. Drag sideways to spin it, tap a world to fly in close. You can also choose a world from the list."
          />
          {body && (
            <button
              type="button"
              className="sticker c-paper btn btn-sm absolute left-4 top-4"
              style={{ '--r': '-2deg' } as React.CSSProperties}
              onClick={() => selectRef.current(null)}
            >
              ← Whole solar system
            </button>
          )}
        </div>

        <aside className="flex flex-col gap-7">
          <Paper tone="mint" tilt={1} innerClassName="p-5">
            <h2 className="mb-3 text-xl">Choose a world</h2>
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Choose a world">
              {LIST.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={selectedId === b.id}
                  onClick={() => selectRef.current(b.id)}
                  className="chip sticker c-white pl-1.5"
                >
                  <img src={pictures[b.id]} alt="" className="h-6 w-6 object-contain" />
                  {b.name}
                </button>
              ))}
            </div>
          </Paper>

          <AnimatePresence mode="wait">
            {body ? (
              <motion.div
                key={body.id}
                initial={{ opacity: 0, y: 16, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', damping: 16, stiffness: 200 }}
                aria-live="polite"
              >
                <Paper as="section" tilt={-0.8} innerClassName="flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <img src={pictures[body.id]} alt="" className="h-14 w-14 object-contain" />
                    <h2 className="text-3xl">{body.name}</h2>
                  </div>
                  <p className="text-lg leading-relaxed">{body.description}</p>
                  <div className="rounded-md bg-yellow/35 p-4">
                    <h3 className="font-display text-lg">What we left there</h3>
                    <p className="mt-1">{body.hardware}</p>
                  </div>
                  <div className="flex flex-col items-start gap-3">
                    {body.archive && (
                      <Link to={body.archive.to} className="cbtn c-pink">
                        {body.archive.label} →
                      </Link>
                    )}
                    <button type="button" className="sticker c-white btn btn-sm" onClick={() => open(`Tell me a cool fact about ${body.name}.`)}>
                      Ask Astro about {body.name}
                    </button>
                  </div>
                </Paper>
              </motion.div>
            ) : (
              <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Paper tone="yellow" tilt={-1.5} innerClassName="p-6 font-display text-lg">
                  👆 Tap a planet in the drawing, or pick one from the list, to fly in close.
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </>
  )
}
