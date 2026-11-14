import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAstro } from '../context/AstroContext'
import AstroAvatar from './AstroAvatar'
import ChatBot from './ChatBot'

/** Floating "Ask Astro" button + chat drawer, available on every page except the full Astro page. */
export default function AstroLauncher() {
  const { isOpen, open, close } = useAstro()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  if (pathname === '/ask-astro') return null

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            onClick={() => open()}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-cyan/40 bg-space-800/90 p-2 sm:pr-5 font-display font-semibold shadow-[0_10px_40px_-10px_rgba(34,211,238,0.7)] backdrop-blur-xl hover:border-cyan"
          >
            <AstroAvatar className="h-11 w-11" />
            <span className="sr-only sm:not-sr-only">Ask Astro</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-labelledby="astro-drawer-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="glass-strong fixed inset-x-3 bottom-3 z-[60] flex h-[78vh] flex-col p-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AstroAvatar className="h-9 w-9" />
                <h2 id="astro-drawer-title" className="text-xl font-bold">
                  Astro AI
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Link to="/ask-astro" onClick={close} className="rounded-full px-3 py-2 text-sm text-muted hover:text-cyan">
                  Full screen
                </Link>
                <button type="button" onClick={close} className="btn btn-ghost min-h-10! px-3! py-1!">
                  <span aria-hidden="true">✕</span>
                  <span className="sr-only">Close Astro</span>
                </button>
              </div>
            </div>
            <ChatBot compact />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
