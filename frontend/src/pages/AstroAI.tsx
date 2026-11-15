import { Link } from 'react-router-dom'
import AstroAvatar from '../components/AstroAvatar'
import ChatBot, { NewChatButton, StatusPill } from '../components/ChatBot'
import Paper from '../components/Paper'
import { usePageContext } from '../hooks/usePageContext'

/** What Astro promises, in its own words. Each line is a rule the backend really enforces. */
const PROMISES = [
  'I only talk about space and science.',
  'I show you where every fact comes from.',
  'I say “I’m not sure” instead of guessing.',
  'I never ask for your name, address or school.',
]

/** A tick drawn in wax crayon (uses the #crayon filter from App.tsx). */
function CrayonTick() {
  return (
    <svg viewBox="0 0 28 24" className="mt-0.5 h-6 w-7 shrink-0" aria-hidden="true">
      <path
        d="M3 13.5c2.6 1.6 4.6 3.6 6.4 6.4C12.6 12.4 17.8 6.6 25 3"
        fill="none"
        stroke="color-mix(in srgb, var(--color-mint) 55%, var(--color-ink))"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#crayon)"
      />
    </svg>
  )
}

/** Astro peeks over the top of a ruled note, taped to the page, with its promise written on it. */
function AstroPromise() {
  return (
    <div className="relative mx-auto max-w-sm pt-16">
      <AstroAvatar className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 -rotate-6" />
      <Paper tilt={1.2} className="relative" innerClassName="ruled relative px-6 pb-6 pt-7">
        <span className="tape absolute -left-1.5 -top-3 w-16" style={{ '--r': '-28deg' } as React.CSSProperties} aria-hidden="true">
          &nbsp;
        </span>
        <span className="tape c-sky absolute -right-1.5 -top-3 w-16" style={{ '--r': '24deg' } as React.CSSProperties} aria-hidden="true">
          &nbsp;
        </span>
        <h2 className="text-2xl leading-8">Astro’s promise</h2>
        <p className="muted leading-8">I’m a robot guide, not a person.</p>
        <ul>
          {PROMISES.map((p) => (
            <li key={p} className="flex gap-2 leading-8">
              <CrayonTick />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Paper>
      <p className="mt-5 px-2 text-sm text-dusk">
        Grown-ups: chats aren’t saved by this site.{' '}
        <Link to="/about" className="link [--link-line:var(--color-yellow)]">
          How Astro works
        </Link>
      </p>
    </div>
  )
}

export default function AstroAI() {
  usePageContext('ask-astro')
  return (
    // The chat fills the screen below the header, so the conversation is the only thing that scrolls.
    <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <Paper
        as="section"
        tilt={-0.3}
        // min-w-0: the one-row suggestions are wide; without it the grid column grows to fit them.
        className="h-[calc(100dvh-7.5rem)] min-h-[30rem] min-w-0 sm:h-[calc(100dvh-8.75rem)]"
        innerClassName="flex h-full flex-col p-4 sm:p-6"
        aria-labelledby="ask-astro-title"
      >
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 id="ask-astro-title" className="text-3xl sm:text-4xl">
            Ask Astro AI
          </h1>
          <StatusPill />
          <span className="ml-auto">
            <NewChatButton />
          </span>
        </div>
        <ChatBot toolbar={false} />
      </Paper>
      <aside className="lg:pt-6">
        <AstroPromise />
      </aside>
    </div>
  )
}
