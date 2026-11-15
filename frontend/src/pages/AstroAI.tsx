import AstroAvatar from '../components/AstroAvatar'
import ChatBot, { NewChatButton, StatusPill } from '../components/ChatBot'
import Paper, { type PaperTone } from '../components/Paper'
import { usePageContext } from '../hooks/usePageContext'

const TONES: PaperTone[] = ['mint', 'yellow', 'pink', 'sky']
const RULES = [
  ['🛡️', 'Safe for kids', 'Astro sticks to space and science, and never asks for personal information.'],
  ['📚', 'Checks its facts', 'Answers about missions come from this museum\'s verified data, with sources.'],
  ['🤔', 'Honest', 'If Astro is not sure, it says so instead of guessing.'],
  ['🧒', 'Simple words', 'It explains things step by step, with everyday examples.'],
]

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
      <aside className="space-y-6">
        <Paper tilt={1} innerClassName="flex items-center gap-4 p-5">
          <AstroAvatar className="h-20 w-20 shrink-0" />
          <p>
            <strong className="font-display">Astro</strong> is an original robot character made for this museum. It is an AI
            helper, not a person.
          </p>
        </Paper>
        {RULES.map(([icon, title, text], i) => (
          <Paper key={title} tone={TONES[i % TONES.length]} tilt={i % 2 ? 1 : -1} innerClassName="flex gap-3 p-4">
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <div>
              <h2 className="text-lg">{title}</h2>
              <p className="text-sm">{text}</p>
            </div>
          </Paper>
        ))}
        <p className="px-1 text-sm text-dusk">
          Grown-ups: chats are not stored by this site. See the About page for how Astro works and its safety rules.
        </p>
      </aside>
    </div>
  )
}
