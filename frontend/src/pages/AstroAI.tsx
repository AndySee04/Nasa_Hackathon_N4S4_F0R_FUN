import AstroAvatar from '../components/AstroAvatar'
import ChatBot from '../components/ChatBot'
import PageHeader from '../components/PageHeader'
import { usePageContext } from '../hooks/usePageContext'

const RULES = [
  ['🛡️', 'Safe for kids', 'Astro sticks to space and science, and never asks for personal information.'],
  ['📚', 'Checks its facts', 'Answers about missions come from this museum\'s verified data, with sources.'],
  ['🤔', 'Honest', 'If Astro is not sure, it says so instead of guessing.'],
  ['🧒', 'Simple words', 'It explains things step by step, with everyday examples.'],
]

export default function AstroAI() {
  usePageContext('ask-astro')
  return (
    <>
      <PageHeader eyebrow="Module F · Your AI space guide" title="Ask Astro AI">
        Ask about any spacecraft, instrument or space word. Astro answers in simple language and shows where its facts come
        from.
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
        <section className="glass flex h-[80vh] min-h-[640px] flex-col p-5 sm:p-6" aria-label="Chat with Astro">
          <ChatBot />
        </section>

        <aside className="space-y-4">
          <div className="glass flex items-center gap-4 p-5">
            <AstroAvatar className="h-20 w-20 shrink-0" />
            <p className="text-muted">
              <strong className="text-ink">Astro</strong> is an original robot character made for this museum. It is an AI
              helper, not a person.
            </p>
          </div>
          {RULES.map(([icon, title, text]) => (
            <div key={title} className="glass flex gap-3 p-4">
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
          <p className="px-1 text-sm text-muted">
            Grown-ups: chats are not stored by this site. See the About page for how Astro works and its safety rules.
          </p>
        </aside>
      </div>
    </>
  )
}
