import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAstro } from '../hooks/useAstro'
import AstroAvatar from './AstroAvatar'
import ChatBot from './ChatBot'
import Paper from './Paper'

/** Astro's chat, on a sheet of paper that slides up. Opened from the "Ask Astro" sticker in the header. */
export default function AstroDrawer() {
  const { isOpen, close } = useAstro()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  if (pathname === '/ask-astro') return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="astro-drawer-title"
          initial={{ opacity: 0, y: 60, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: 60, rotate: 2 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed inset-x-3 bottom-3 z-[60] h-[78vh] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[27rem]"
        >
          <Paper className="h-full" innerClassName="flex h-full flex-col p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AstroAvatar className="h-10 w-10" />
                <h2 id="astro-drawer-title" className="text-2xl">
                  Astro AI
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/ask-astro" onClick={close} className="link font-display text-sm font-normal">
                  Full screen
                </Link>
                <button type="button" onClick={close} className="sticker c-white btn btn-sm h-11 w-11 p-0!">
                  <span aria-hidden="true">✕</span>
                  <span className="sr-only">Close Astro</span>
                </button>
              </div>
            </div>
            <ChatBot compact />
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
