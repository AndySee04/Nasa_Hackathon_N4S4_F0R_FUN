import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Paper from '../components/Paper'
import { artifactsByWorld } from '../data'
import { bodyById, type Body } from '../data/planets'
import { useAstro } from '../hooks/useAstro'
import { useCutEdges } from '../hooks/useCutEdges'
import { usePageContext } from '../hooks/usePageContext'
import { mountCrayonSky, type SkyHandle } from '../lib/crayonSky'

/** Name tags hang off the two worlds where most of our machines are. */
const TAGS = [
  { id: 'moon', title: 'The Moon', note: `${artifactsByWorld('moon').length} machines here`, tone: 'yellow', tilt: -2 },
  { id: 'mars', title: 'Mars', note: `${artifactsByWorld('mars').length} landers and rovers`, tone: 'orange', tilt: 3 },
] as const

const clamp = (v: number) => Math.max(0, Math.min(1, v))
const ease = (t: number) => t * t * (3 - 2 * t)
/** Space between a followed planet and its card. */
const GAP = 40

export default function Home() {
  usePageContext('home')
  const { open } = useAstro()
  const [planet, setPlanet] = useState<Body | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const stringsRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const tagRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const skyRef = useRef<SkyHandle | null>(null)
  /** The planet the camera follows. Kept in a ref too, because the drawing loop reads it every frame. */
  const openId = useRef<string | null>(null)

  const focusPlanet = useCallback((b: Body | null) => {
    openId.current = b?.id ?? null
    setPlanet(b)
  }, [])
  const closePlanet = useCallback(() => {
    focusPlanet(null)
    skyRef.current?.select(null)
  }, [focusPlanet])

  useEffect(() => {
    const canvas = canvasRef.current!
    const narrow = () => window.innerWidth < 700
    const maxZoom = narrow() ? 1.7 : 2.4
    const tagIds = TAGS.map((t) => t.id)

    const sky = mountCrayonSky(canvas, {
      center: narrow() ? [0.5, 0.5] : [0.5, 0.53],
      fill: narrow() ? 0.95 : 0.47,
      maxZoom,
      // Where the followed planet sits, and how big. Wide screens centre the planet and its card as a pair;
      // phones put the planet near the top with the card underneath.
      focus: (_b, w, h) => {
        if (narrow()) return { x: w / 2, y: Math.max(130, h * 0.23), r: Math.min(w * 0.28, h * 0.14) }
        const r = Math.min(w, h) * 0.24
        const pair = r * 2 + GAP + (cardRef.current?.offsetWidth || 340)
        return { x: (w - pair) / 2 + r, y: h * 0.54, r }
      },
      onFrame: (pos) => {
        // Tags hang under their planet on a crayon string.
        let d = ''
        for (const id of tagIds) {
          const t = tagRefs.current[id]
          const p = pos[id]
          if (!t || !p || !t.offsetWidth) continue
          const x = p.x - t.offsetWidth / 2
          const y = p.y + p.r + 30
          t.style.transform = `translate(${x}px, ${y}px)`
          d += `M${p.x} ${p.y + p.r + 2} Q ${p.x + 6} ${p.y + p.r + 16} ${p.x} ${y + 4} `
        }
        pathRef.current?.setAttribute('d', d)
        // The open card rides along beside the followed planet (underneath it on phones).
        const card = cardRef.current
        const id = openId.current
        if (card && id && pos[id]) {
          const p = pos[id]
          const w = card.offsetWidth
          const h = card.offsetHeight
          let x: number
          let y: number
          if (narrow()) {
            x = (window.innerWidth - w) / 2
            y = Math.max(80, Math.min(p.y + p.ext + 20, window.innerHeight - h - 16))
          } else {
            x = p.x + p.ext + GAP
            if (x + w > window.innerWidth - 12) x = p.x - p.ext - GAP - w
            x = Math.max(12, Math.min(x, window.innerWidth - w - 12))
            y = Math.max(80, Math.min(p.y - h / 2, window.innerHeight - h - 12))
          }
          card.style.transform = `translate(${x}px, ${y}px) rotate(1deg)`
        }
      },
      onSelect: (b) => focusPlanet(b),
    })
    skyRef.current = sky

    // Scrolling zooms into the planets.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const track = trackRef.current!
    if (still) track.style.height = '100svh'
    const onScroll = () => {
      const len = track.offsetHeight - window.innerHeight
      const p = still ? 0 : clamp(window.scrollY / Math.max(1, len))
      sky.setZoom(1 + ease(p) * (maxZoom - 1))
      // The title and intro lift away early in the zoom.
      const out = clamp(p / 0.35)
      if (bannerRef.current) {
        bannerRef.current.style.opacity = String(1 - out)
        bannerRef.current.style.transform = `translateY(${-out * 60}px)`
      }
      if (bottomRef.current) {
        bottomRef.current.style.opacity = String(1 - out)
        bottomRef.current.style.transform = `translateY(${out * 60}px)`
      }
      // A note pops in half-way, then fades as the zoom ends.
      if (noteRef.current) noteRef.current.style.opacity = String(clamp((p - 0.45) / 0.15) * (1 - clamp((p - 0.9) / 0.1)))
      // After the zoom: dim the sky and hide the tags so the footer is easy to read.
      const after = clamp((window.scrollY - len) / (window.innerHeight * 0.5))
      if (after > 0.2 && openId.current) closePlanet()
      if (dimRef.current) dimRef.current.style.opacity = String(after * 0.7)
      for (const id of tagIds) {
        const t = tagRefs.current[id]
        if (t) t.style.opacity = String(1 - after)
      }
      if (stringsRef.current) stringsRef.current.style.opacity = String(1 - after)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openId.current && closePlanet()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('keydown', onKey)
    onScroll()

    return () => {
      sky.destroy()
      skyRef.current = null
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [closePlanet, focusPlanet])

  const pickTag = (id: string) => {
    skyRef.current?.select(id)
    focusPlanet(bodyById(id) ?? null)
  }

  return (
    <div className={`home ${planet ? 'focused' : ''}`}>
      <canvas
        ref={canvasRef}
        className="sky-canvas"
        aria-label="A crayon drawing of the solar system. Drag to spin it, tap a planet to learn about it."
      />
      <div ref={dimRef} className="sky-dim" aria-hidden="true" />

      <div ref={trackRef} className="zoom-track relative z-10">
        <section className="hero" aria-labelledby="home-title">
          <div ref={bannerRef}>
            <Paper tilt={-1} innerClassName="flex flex-col items-center gap-1.5 px-5 py-3 sm:flex-row sm:gap-5 sm:px-8 sm:pb-3 sm:pt-3.5">
              <h1 id="home-title">N4S4 F0R FUN</h1>
              <span className="max-w-[15em] font-display text-[1.15rem] leading-tight sm:text-left">
                Explore the forgotten. Discover the extraordinary.
              </span>
            </Paper>
          </div>
          <div ref={bottomRef} className="flex flex-col items-center gap-2">
            <Link to="/moon" className="sticker c-yellow btn text-[1.1rem]" style={{ '--r': '-1deg' } as React.CSSProperties}>
              Meet the machines
            </Link>
            <p className="m-0 font-display text-[0.95rem] text-dusk">or scroll to zoom in</p>
          </div>
        </section>
      </div>

      <div ref={noteRef} className="zoom-note" aria-hidden="true">
        <Paper tone="yellow" innerClassName="px-5 py-3 text-center font-display text-[1.2rem] leading-snug">
          <b className="font-extrabold">Closer!</b> Most of our machines landed on the Moon and Mars.
        </Paper>
      </div>

      <svg ref={stringsRef} className="sky-strings" aria-hidden="true">
        <path ref={pathRef} fill="none" stroke="#f7f3e8" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {TAGS.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            tagRefs.current[t.id] = el
          }}
          type="button"
          data-id={t.id}
          className="name-tag paper-glue"
          onClick={() => pickTag(t.id)}
        >
          <Paper as="span" tone={t.tone} tilt={t.tilt} innerAs="span" className="block filter-none">
            <b className="block font-extrabold">{t.title}</b>
            {t.note}
          </Paper>
        </button>
      ))}

      <aside
        ref={cardRef}
        className={`planet-card paper-glue ${planet ? 'open' : ''}`}
        aria-live="polite"
        aria-label={planet ? `About ${planet.name}` : undefined}
        inert={!planet}
      >
        <PlanetCard body={planet} onClose={closePlanet} onAsk={(q) => open(q)} />
      </aside>

    </div>
  )
}

/** The card that pops up beside a planet. Keeps showing the last planet while it fades out. */
function PlanetCard({ body, onClose, onAsk }: { body: Body | null; onClose: () => void; onAsk: (q: string) => void }) {
  const [last, setLast] = useState<Body | null>(body)
  if (body && body !== last) setLast(body)
  const b = body ?? last
  const ref = useCutEdges<HTMLDivElement>(useId())
  return (
    <div ref={ref} className="paper-cut relative px-6 pb-5 pt-6">
      <button type="button" onClick={onClose} className="absolute right-3 top-3 h-11 w-11 cursor-pointer font-display text-xl" aria-label="Close">
        ✕
      </button>
      {b && (
        <>
          <h2 className="pr-10 text-[1.8rem] leading-none">{b.name}</h2>
          <p className="mt-2.5">{b.description}</p>
          <p className="mt-3.5 rounded-md bg-yellow/35 px-3.5 py-3">
            <b className="font-display">What we left there: </b>
            {b.hardware}
          </p>
          {/* A sticker, not a crayon button: the crayon filter is slow to repaint on a card that moves every frame. */}
          <p className="mt-4">
            {b.archive ? (
              <Link to={b.archive.to} className="sticker c-pink btn">
                {b.archive.label}
              </Link>
            ) : (
              <button type="button" className="sticker c-pink btn" onClick={() => onAsk(`Tell me a cool fact about ${b.name}.`)}>
                Ask Astro about {b.name}
              </button>
            )}
          </p>
        </>
      )}
    </div>
  )
}
