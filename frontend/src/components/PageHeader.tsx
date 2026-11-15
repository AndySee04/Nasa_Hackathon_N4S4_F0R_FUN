import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import Paper from './Paper'

/** The title of a page: one strip of paper, taped on, with a short intro. */
export default function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 160 }}
      className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6"
    >
      <Paper tilt={-1} className="max-w-4xl" innerClassName="px-6 pb-6 pt-5 sm:px-9 sm:pb-7">
        <p className="tape -ml-1 mb-3">{eyebrow}</p>
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {children && <div className="mt-3 max-w-3xl text-lg">{children}</div>}
      </Paper>
    </motion.header>
  )
}
