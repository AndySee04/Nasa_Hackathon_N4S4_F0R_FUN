import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../data/navigation'
import { useAstro } from '../hooks/useAstro'
import { useAuth } from '../hooks/useAuth'
import AstroAvatar from './AstroAvatar'
import Paper from './Paper'
import ProfileAvatar from './ProfileAvatar'

/** Tabs across the top. Ask Astro has its own sticker on the right; About lives in the menu and footer. */
const TABS = NAV_ITEMS.filter((i) => i.to !== '/ask-astro' && i.to !== '/about')
/** Each tab is stuck on at its own slight angle. */
const TILTS = [-2, 2, -1, 3, -2, 1.5, -1.5]

export function LogoMark({ className = 'h-[30px] w-[30px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse cx="20" cy="21" rx="17" ry="6" fill="none" stroke="#22203a" strokeWidth="2.6" transform="rotate(-18 20 21)" />
      <circle cx="20" cy="20" r="9" fill="#63b7f0" stroke="#22203a" strokeWidth="2" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link
      to="/"
      className="sticker c-paper flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-2 pr-4 font-display text-[1.1rem] font-extrabold no-underline"
      style={{ '--r': '-3deg' } as React.CSSProperties}
      aria-label="N4S4 F0R FUN home"
    >
      <LogoMark />
      {/* Icon only while the tab row is tight (1180–1440px), so all the tabs fit on one line. */}
      <span className="hidden sm:max-[1179px]:inline min-[1440px]:inline">N4S4 F0R FUN</span>
    </Link>
  )
}

function AstroButton() {
  const { open } = useAstro()
  const { pathname } = useLocation()
  const cls = 'sticker flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3.5 font-display no-underline'
  const style = { '--r': '3deg' } as React.CSSProperties
  const face = (
    <>
      <AstroAvatar className="h-8 w-8" />
      <span className="hidden sm:inline">Ask Astro</span>
    </>
  )
  // On the Astro page itself there is nothing to open: the sticker just marks where you are.
  if (pathname === '/ask-astro') {
    return (
      <Link to="/ask-astro" aria-current="page" aria-label="Ask Astro" className={`${cls} c-yellow font-extrabold`} style={style}>
        {face}
      </Link>
    )
  }
  return (
    <button type="button" onClick={() => open()} aria-label="Ask Astro" className={`${cls} c-white`} style={style}>
      {face}
    </button>
  )
}

/** Sign in, or shows who is signed in. Hidden when accounts aren't set up. */
function AccountButton() {
  const { status, displayName } = useAuth()
  if (status === 'disabled' || status === 'loading') return null
  const signedIn = status === 'signed-in'
  return (
    <NavLink
      to="/account"
      aria-label={signedIn ? `Account: signed in as ${displayName}` : 'Sign in'}
      className={({ isActive }) =>
        `sticker flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1.5 pr-1.5 font-display no-underline sm:max-[1179px]:pr-3.5 min-[1440px]:pr-3.5 ${isActive ? 'c-yellow font-extrabold' : 'c-white'}`
      }
      style={{ '--r': '-2deg' } as React.CSSProperties}
    >
      {signedIn ? (
        <ProfileAvatar px={32} />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sky text-ink" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="8.5" r="3.8" />
            <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
          </svg>
        </span>
      )}
      {/* Label hides while the tab row is showing (1180–1440px) so the tabs stay on one line. */}
      <span className="hidden max-w-36 truncate sm:max-[1179px]:inline min-[1440px]:inline">{signedIn ? displayName : 'Sign in'}</span>
    </NavLink>
  )
}

export default function Navbar() {
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu])

  return (
    <header className={`site-header ${pathname === '/' ? '' : 'banded'}`}>
      <div className="flex items-center gap-3">
        <Logo />
        <nav aria-label="Main" className="mx-auto flex items-center">
          <ul className="hidden flex-wrap justify-center gap-2.5 min-[1180px]:flex">
            {TABS.map((item, i) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className="tab sticker"
                  style={{ '--r': `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties}
                >
                  {item.short}
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="sticker c-paper btn btn-sm min-[1180px]:hidden"
            aria-expanded={menu}
            aria-controls="site-menu"
            onClick={() => setMenu((v) => !v)}
            style={{ '--r': '-1deg' } as React.CSSProperties}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            Menu
          </button>
        </nav>
        <AccountButton />
        <AstroButton />
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="site-menu"
            initial={{ opacity: 0, y: -12, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="mx-auto mt-4 max-w-xl"
          >
            <Paper innerClassName="p-5">
              <p className="mb-3 font-display text-lg">Where to next?</p>
              <ul className="grid grid-cols-2 gap-3">
                {NAV_ITEMS.map((item, i) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMenu(false)}
                      className={({ isActive }) => `sticker btn btn-sm w-full ${isActive ? 'c-yellow font-extrabold' : 'c-white'}`}
                      style={{ '--r': `${TILTS[i % TILTS.length] / 2}deg` } as React.CSSProperties}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
