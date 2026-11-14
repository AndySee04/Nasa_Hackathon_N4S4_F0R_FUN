import { Link } from 'react-router-dom'
import { NAV_ITEMS } from '../data/navigation'
import { Logo } from './Navbar'

const DATA_SOURCES = [
  { title: 'NASA Space Science Data Coordinated Archive (NSSDCA)', url: 'https://nssdc.gsfc.nasa.gov/' },
  { title: 'NASA Image and Video Library', url: 'https://images.nasa.gov/' },
  { title: 'NASA Science', url: 'https://science.nasa.gov/' },
]

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/10 bg-space-950/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted">
            A digital space museum about the robots and spacecraft humanity has left across the solar system. Built for the
            2026 NASA Space Apps Challenge.
          </p>
          <p className="text-sm text-muted">
            A student hackathon project. Not affiliated with or endorsed by NASA.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Explore</h2>
          <ul className="grid grid-cols-2 gap-2 text-muted">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-cyan">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Data sources</h2>
          <ul className="space-y-2 text-muted">
            {DATA_SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan">
                  {s.title} <span aria-hidden="true">↗</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Every artifact page lists its own sources. Spotted a mistake?{' '}
            <Link to="/about" className="text-cyan underline">
              Tell us
            </Link>
            .
          </p>
        </div>
      </div>
      <p className="border-t border-white/5 py-5 text-center text-sm text-muted">
        © 2026 N4S4 F0R FUN · MIT licence · Images courtesy of NASA unless otherwise noted
      </p>
    </footer>
  )
}
