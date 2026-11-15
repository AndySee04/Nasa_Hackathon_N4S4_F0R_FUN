import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { formatDate } from '../data'
import { KIND_META } from '../data/labels'
import type { TimelineKind } from '../types/artifact'

export interface TimelineItem {
  key: string
  date: string
  label: string
  kind: TimelineKind
  extra?: ReactNode
}

/** Events along a dashed crayon line, each marked with a little sticker. Meant to sit on paper. */
export default function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative ml-4 border-l-[3px] border-dashed border-ink/30 pl-0">
      {items.map((item, i) => {
        const meta = KIND_META[item.kind]
        return (
          <motion.li
            key={item.key}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
            className="relative list-none pb-7 pl-9 last:pb-0"
          >
            <span
              className={`sticker ${meta.color} absolute -left-[22px] top-0 flex h-10 w-10 items-center justify-center rounded-full border-4 text-base`}
              style={{ '--r': `${i % 2 ? 6 : -6}deg` } as React.CSSProperties}
              aria-hidden="true"
            >
              {meta.icon}
            </span>
            <p className="muted font-display text-sm">
              <time dateTime={item.date}>{formatDate(item.date)}</time> · {meta.label}
            </p>
            <p className="text-lg">{item.label}</p>
            {item.extra}
          </motion.li>
        )
      })}
    </ol>
  )
}
