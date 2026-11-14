import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16"
    >
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
        <span className="text-gradient">{title}</span>
      </h1>
      {children && <div className="mt-4 max-w-3xl text-lg text-muted">{children}</div>}
    </motion.header>
  )
}
