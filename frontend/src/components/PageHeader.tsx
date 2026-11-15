import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import Paper from './Paper'

/**
 * The title of a page: one slim strip of paper, taped on, with a short intro.
 * Kept small so the page's own content starts near the top of the screen.
 */
export default function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 160 }}
      className="mx-auto max-w-7xl px-4 pb-6 pt-3 sm:px-6"
    >
      <Paper tilt={-0.5} className="max-w-4xl" innerClassName="px-5 py-4 sm:px-7">
        <p className="tape -ml-1 mb-2">{eyebrow}</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
        {children && <div className="mt-1.5 max-w-3xl leading-snug sm:text-lg">{children}</div>}
      </Paper>
    </motion.header>
  )
}
