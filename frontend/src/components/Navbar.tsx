import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../data/navigation'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-xl" aria-label="N4S4 F0R FUN home">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <defs>
          <radialGradient id="logo-planet" cx="35%" cy="35%" r="70%">
            <stop offset="0" stopColor="#9be7ff" />
            <stop offset="1" stopColor="#6d4dff" />
          </radialGradient>
        </defs>
        <ellipse cx="20" cy="21" rx="17" ry="6" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(-18 20 21)" />
        <circle cx="20" cy="20" r="9" fill="url(#logo-planet)" />
        <circle cx="34" cy="15" r="2.5" fill="#a78bfa" />
      </svg>
      <span className="font-display text-lg font-bold tracking-wide">
        N4S4 <span className="text-cyan">F0R</span> FUN
      </span>
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-space-900/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                title={item.label}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-[0.95rem] font-semibold transition ${
                    item.to === '/ask-astro'
                      ? 'bg-gradient-to-r from-cyan/20 to-violet/25 text-ink ring-1 ring-cyan/40 hover:ring-cyan'
                      : isActive
                        ? 'bg-white/10 text-ink'
                        : 'text-muted hover:bg-white/5 hover:text-ink'
                  }`
                }
              >
                {item.short}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn btn-ghost min-h-11! px-4! xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          <span>Menu</span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 xl:hidden"
          >
            <ul className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:grid-cols-2 sm:px-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-lg font-semibold ${isActive ? 'bg-white/10 text-ink' : 'text-muted hover:bg-white/5 hover:text-ink'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
