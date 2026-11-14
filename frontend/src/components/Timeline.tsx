import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { formatDate } from '../data'
import type { TimelineKind } from '../types/artifact'

export const KIND_META: Record<TimelineKind, { icon: string; label: string; color: string }> = {
  launch: { icon: '🚀', label: 'Launch', color: 'bg-cyan' },
  journey: { icon: '🛰️', label: 'Journey', color: 'bg-sky-400' },
  arrival: { icon: '📍', label: 'Arrival', color: 'bg-violet' },
  operations: { icon: '🔧', label: 'Science operations', color: 'bg-indigo-400' },
  discovery: { icon: '💡', label: 'Discovery', color: 'bg-amber' },
  end: { icon: '🌙', label: 'Mission end', color: 'bg-status-lost' },
  status: { icon: '📡', label: 'Status update', color: 'bg-status-inactive' },
}

export interface TimelineItem {
  key: string
  date: string
  label: string
  kind: TimelineKind
  extra?: ReactNode
}

export default function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-white/10">
      {items.map((item, i) => {
        const meta = KIND_META[item.kind]
        return (
          <motion.li
            key={item.key}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
            className="relative pb-7 pl-8 last:pb-0"
          >
            <span
              className={`absolute -left-[17px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full ${meta.color} text-base shadow-lg ring-4 ring-space-900`}
              aria-hidden="true"
            >
              {meta.icon}
            </span>
            <p className="text-sm font-semibold text-muted">
              <time dateTime={item.date}>{formatDate(item.date)}</time> · {meta.label}
            </p>
            <p className="text-lg text-ink">{item.label}</p>
            {item.extra}
          </motion.li>
        )
      })}
    </ol>
  )
}
