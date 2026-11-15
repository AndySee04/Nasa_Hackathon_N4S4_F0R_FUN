import { Link } from 'react-router-dom'
import { NAV_ITEMS } from '../data/navigation'
import { LogoMark } from './Navbar'
import Paper from './Paper'

const DATA_SOURCES = [
  { title: 'NASA Space Science Data Coordinated Archive (NSSDCA)', url: 'https://nssdc.gsfc.nasa.gov/' },
  { title: 'NASA Image and Video Library', url: 'https://images.nasa.gov/' },
  { title: 'NASA Science', url: 'https://science.nasa.gov/' },
]

export default function Footer() {
  return (
    <footer className="relative z-20 mx-auto mt-24 w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Paper tilt={-0.4} innerClassName="grid gap-10 px-6 py-10 sm:px-10 md:grid-cols-3">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-display text-xl font-extrabold">
            <LogoMark className="h-9 w-9" /> N4S4 F0R FUN
          </p>
          <p>
            A digital space museum about the robots and spacecraft humanity has left across the solar system. Built for the
            2026 NASA Space Apps Challenge.
          </p>
          <p className="muted text-sm">A student hackathon project. Not affiliated with or endorsed by NASA.</p>
        </div>

        <div>
          <h2 className="scribble mb-4 inline-block text-xl">Explore</h2>
          <ul className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="link font-normal">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="scribble mb-4 inline-block text-xl">Data sources</h2>
          <ul className="space-y-2">
            {DATA_SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link font-normal">
                  {s.title} <span aria-hidden="true">↗</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="muted mt-4 text-sm">
            Every machine&apos;s page lists its own sources. Spotted a mistake?{' '}
            <Link to="/about" className="link">
              Tell us
            </Link>
            .
          </p>
        </div>
      </Paper>
      <p className="mt-6 text-center font-display text-sm text-dusk">
        © 2026 N4S4 F0R FUN · MIT licence · Images courtesy of NASA unless otherwise noted
      </p>
    </footer>
  )
}
