import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAstro } from '../hooks/useAstro'
import AstroAvatar from './AstroAvatar'
import ChatBot, { NewChatButton, StatusPill } from './ChatBot'
import Paper from './Paper'

/**
 * Astro's chat in a full-height panel on the right, opened from the "Ask Astro" sticker in the header.
 * Desktop: the page stays visible on the left, so a child can read and ask at the same time.
 * Phone: the panel fills the screen, because a narrow strip of page beside it is no use.
 */
export default function AstroDrawer() {
  const { isOpen, close } = useAstro()
  const { pathname } = useLocation()
  const still = useReducedMotion()

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
          initial={still ? { opacity: 0 } : { opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={still ? { opacity: 0 } : { opacity: 0, x: 60 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="fixed inset-1.5 z-[60] sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[30rem]"
        >
          <Paper className="h-full" innerClassName="flex h-full flex-col px-4 pb-3 pt-4 sm:px-5">
            <div className="mb-2 flex items-center gap-2.5">
              <AstroAvatar className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 id="astro-drawer-title" className="text-2xl leading-none">
                  Astro
                </h2>
                <StatusPill />
              </div>
              <NewChatButton />
              <Link to="/ask-astro" onClick={close} className="link hidden font-display text-sm font-normal sm:inline">
                Full screen
              </Link>
              <button type="button" onClick={close} className="sticker c-white btn btn-sm h-11 w-11 shrink-0 p-0!">
                <span aria-hidden="true">✕</span>
                <span className="sr-only">Close Astro</span>
              </button>
            </div>
            <ChatBot compact toolbar={false} />
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
