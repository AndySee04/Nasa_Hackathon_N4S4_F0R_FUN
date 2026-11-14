import { AnimatePresence, motion } from 'framer-motion'
import { Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SceneFallback, SpaceScene } from '../components/LazySpaceScene'
import PageHeader from '../components/PageHeader'
import { useAstro } from '../hooks/useAstro'
import { BODIES, bodyById, MOON_BODY } from '../data/planets'
import { usePageContext } from '../hooks/usePageContext'

export default function UniverseExplorer() {
  usePageContext('explore')
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('body')
  const body = bodyById(selectedId)
  const { open } = useAstro()

  const select = (id: string) => {
    if (id) setParams({ body: id }, { replace: true })
    else setParams({}, { replace: true })
  }

  const list = [...BODIES.slice(0, 4), MOON_BODY, ...BODIES.slice(4)]

  return (
    <>
      <PageHeader eyebrow="Module A · Solar System Explorer" title="Explore the Universe">
        Drag to spin, scroll or pinch to zoom, and click any world to learn about it and the machines we sent there. Sizes
        and distances are squashed so everything fits: the real solar system is mostly empty space!
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="glass relative overflow-hidden p-0">
          <Suspense fallback={<SceneFallback className="h-[60vh] min-h-[380px] w-full" />}>
                <SpaceScene selectedId={selectedId} onSelect={select} className="h-[60vh] min-h-[380px] w-full" />
              </Suspense>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="glass p-4">
            <h2 className="mb-3 text-lg font-semibold">Choose a world</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a world">
              {list.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={selectedId === b.id}
                  onClick={() => select(b.id)}
                  className={`chip min-h-10 ${selectedId === b.id ? 'border-cyan bg-cyan/20 text-ink' : 'border-white/15 text-muted hover:text-ink'}`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: b.colors[0] }} aria-hidden="true" />
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {body ? (
              <motion.section
                key={body.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="glass flex flex-col gap-4 p-6"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-12 w-12 rounded-full"
                    style={{ background: `radial-gradient(circle at 35% 35%, ${body.colors[0]}, ${body.colors[1]})` }}
                    aria-hidden="true"
                  />
                  <h2 className="text-3xl font-bold">{body.name}</h2>
                </div>
                <p className="text-lg leading-relaxed">{body.description}</p>
                <div className="rounded-2xl bg-white/5 p-4">
                  <h3 className="font-semibold text-cyan">Hardware we left there</h3>
                  <p className="mt-1 text-muted">{body.hardware}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {body.archive && (
                    <Link to={body.archive.to} className="btn btn-primary">
                      {body.archive.label} →
                    </Link>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => open(`Tell me a cool fact about ${body.name}.`)}>
                    Ask Astro about {body.name}
                  </button>
                </div>
              </motion.section>
            ) : (
              <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-6 text-muted">
                <p className="text-lg">👆 Pick a planet in the scene or from the list to start exploring.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </>
  )
}
