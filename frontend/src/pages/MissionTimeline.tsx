import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Paper from '../components/Paper'
import Timeline from '../components/Timeline'
import { KIND_META } from '../data/labels'
import { artifacts, dateSortKey, ERAS, eraOf } from '../data'
import { usePageContext } from '../hooks/usePageContext'
import { HARDWARE_LABELS, WORLD_LABELS, type HardwareType, type TimelineKind, type World } from '../types/artifact'

type Opt<T extends string> = T | 'all'


function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Opt<T>
  options: { value: T; label: string }[]
  onChange: (v: Opt<T>) => void
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 font-display">{label}</p>
      <div className="flex flex-wrap gap-2">
        {[{ value: 'all' as Opt<T>, label: 'All' }, ...options].map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className="chip sticker c-white"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MissionTimeline() {
  usePageContext('timeline')
  const [world, setWorld] = useState<Opt<World>>('all')
  const [era, setEra] = useState<Opt<string>>('all')
  const [hardware, setHardware] = useState<Opt<HardwareType>>('all')
  const [kind, setKind] = useState<Opt<TimelineKind>>('all')

  const hardwareTypes = Array.from(new Set(artifacts.map((a) => a.hardwareType)))

  const items = useMemo(() => {
    return artifacts
      .filter((a) => (world === 'all' || a.world === world) && (era === 'all' || eraOf(a) === era) && (hardware === 'all' || a.hardwareType === hardware))
      .flatMap((a) =>
        a.timeline
          .filter((e) => kind === 'all' || e.kind === kind)
          .map((e, i) => ({
            key: `${a.id}-${i}`,
            date: e.date,
            kind: e.kind,
            label: e.label,
            extra: (
              <Link to={`/artifact/${a.id}`} className="link mt-1 inline-block text-sm">
                {a.name} · {WORLD_LABELS[a.world]} →
              </Link>
            ),
          })),
      )
      .sort((x, y) => dateSortKey(x.date).localeCompare(dateSortKey(y.date)))
  }, [world, era, hardware, kind])

  return (
    <>
      <PageHeader eyebrow="Module D · Mission Timeline" title="Mission Timeline">
        Travel through more than 50 years of exploration, from launch to final status. Use the filters to follow one world,
        one era or one kind of machine.
      </PageHeader>

      <div className="mx-auto grid max-w-7xl items-start gap-9 px-4 sm:px-6 lg:grid-cols-[330px_1fr]">
        <Paper as="aside" tone="mint" tilt={-0.8} className="lg:sticky lg:top-28" innerClassName="space-y-5 p-5">
          <FilterGroup label="Destination" value={world} onChange={setWorld} options={(Object.keys(WORLD_LABELS) as World[]).map((w) => ({ value: w, label: WORLD_LABELS[w] }))} />
          <FilterGroup label="Mission era (launch decade)" value={era} onChange={setEra} options={ERAS.map((e) => ({ value: e, label: e }))} />
          <FilterGroup label="Hardware type" value={hardware} onChange={setHardware} options={hardwareTypes.map((h) => ({ value: h, label: HARDWARE_LABELS[h] }))} />
          <FilterGroup
            label="Event type"
            value={kind}
            onChange={setKind}
            options={(Object.keys(KIND_META) as TimelineKind[]).map((k) => ({ value: k, label: `${KIND_META[k].icon} ${KIND_META[k].label}` }))}
          />
        </Paper>

        <section aria-live="polite">
          <p className="mb-6 font-display text-dusk">
            Showing <strong className="label c-yellow font-extrabold">{items.length}</strong> events
          </p>
          {items.length > 0 ? (
            <Paper tilt={0.3} innerClassName="p-6 pl-4 sm:p-8 sm:pl-6">
              <Timeline items={items} />
            </Paper>
          ) : (
            <Paper tone="yellow" tilt={-1} innerClassName="p-8 text-center font-display text-lg">
              No events match these filters. Try choosing &quot;All&quot; for one of them.
            </Paper>
          )}
        </section>
      </div>
    </>
  )
}
