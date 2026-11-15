import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAstro } from '../hooks/useAstro'
import { artifactById } from '../data'
import { getSuggestedQuestions } from '../services/api'
import AstroAvatar from './AstroAvatar'

const FALLBACK_QUESTIONS = [
  'What is a descent stage?',
  'Why did Opportunity stop working?',
  'How does Voyager 1 still talk to Earth?',
  'What is a marsquake?',
]

export function BackendBadge() {
  const { backend, recheckBackend } = useAstro()
  const map = {
    checking: { dot: 'bg-yellow animate-pulse', text: 'Checking Astro AI server…' },
    online: {
      dot: 'bg-status-operational',
      text: backend.state === 'online' && backend.mode === 'llm' ? 'Astro AI online · AI model connected' : 'Astro AI online · knowledge mode (no AI model key set)',
    },
    offline: { dot: 'bg-status-lost', text: 'Astro AI server offline' },
  } as const
  const s = map[backend.state]
  return (
    <div className="muted flex items-center gap-2 font-display text-sm" role="status" aria-live="polite">
      <span className={`h-3 w-3 rounded-full border-2 border-ink/60 ${s.dot}`} aria-hidden="true" />
      <span>{s.text}</span>
      {backend.state === 'offline' && (
        <button type="button" className="link" onClick={recheckBackend}>
          Retry
        </button>
      )}
    </div>
  )
}

export default function ChatBot({ compact = false }: { compact?: boolean }) {
  const { messages, loading, send, pageContext, backend, reset } = useAstro()
  const [input, setInput] = useState('')
  const [starters, setStarters] = useState<string[]>(FALLBACK_QUESTIONS)
  const listRef = useRef<HTMLDivElement>(null)
  const contextArtifact = artifactById(pageContext.artifactId)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (backend.state !== 'online') return
    let alive = true
    getSuggestedQuestions(pageContext)
      .then((r) => alive && r.questions.length && setStarters(r.questions))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [backend.state, pageContext])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = input
    setInput('')
    void send(text)
  }

  const lastSuggestions = [...messages].reverse().find((m) => m.role === 'assistant' && m.suggestions?.length)?.suggestions
  const chips = messages.length <= 1 ? starters : lastSuggestions ?? []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-ink/20 pb-3">
        <BackendBadge />
        {messages.length > 1 && (
          <button type="button" onClick={reset} className="link font-display text-sm font-normal">
            New chat
          </button>
        )}
      </div>
      {contextArtifact && (
        <p className="label c-sky mt-3 self-start text-sm">
          Astro knows you are looking at <strong>{contextArtifact.name}</strong>.
        </p>
      )}

      <div
        ref={listRef}
        className={`mt-3 flex-1 space-y-4 overflow-y-auto pr-1 min-h-40`}
        aria-live="polite"
        aria-label="Conversation with Astro"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <AstroAvatar className="h-10 w-10 shrink-0" />}
            <div
              className={`max-w-[85%] rounded-[22px] border-2 border-ink/80 px-4 py-3 ${
                m.role === 'user'
                  ? 'rounded-br-md bg-sky'
                  : m.error
                    ? 'rounded-bl-md bg-orange/40'
                    : 'rounded-bl-md bg-sticker'
              }`}
              style={{ rotate: m.role === 'user' ? '0.6deg' : '-0.4deg' }}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
              {m.safetyNote && <p className="label c-yellow mt-2 text-sm">🛡️ {m.safetyNote}</p>}
              {m.images && m.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {m.images.map((img) => (
                    <figure key={img.url} className="m-0">
                      <a href={img.page_url} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={img.url} alt={img.title} loading="lazy" className="polaroid aspect-square w-full object-cover" />
                      </a>
                      <figcaption className="muted mt-1 text-xs leading-snug">
                        {img.kind === 'illustration' ? '🎨 AI illustration · ' : '📷 '}
                        {img.title} · {img.credit}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 border-t-2 border-dashed border-ink/20 pt-2">
                  <p className="muted font-display text-sm">Where this comes from:</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {m.sources.map((s) => (
                      <li key={s.url + s.title}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="link font-normal">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <AstroAvatar className="h-10 w-10" thinking />
            <p className="muted rounded-[22px] rounded-bl-md border-2 border-ink/80 bg-sticker px-4 py-3">Astro is thinking…</p>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-3">
          <p className="muted mb-2 font-display text-sm">{messages.length <= 1 ? 'Try asking:' : 'Explore further:'}</p>
          <div className="flex flex-wrap gap-2">
            {chips.slice(0, 4).map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void send(q)}
                className="chip sticker c-lilac"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor={compact ? 'astro-input-compact' : 'astro-input'} className="sr-only">
          Ask Astro a question
        </label>
        <input
          id={compact ? 'astro-input-compact' : 'astro-input'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder="Ask about a spacecraft or a space word…"
          className="min-h-12 min-w-0 flex-1 rounded-full border-[3px] border-ink/80 bg-sticker px-5 text-ink placeholder:text-ink-soft focus:border-ink focus:outline-dashed focus:outline-3 focus:outline-offset-2 focus:outline-ink"
        />
        <button type="submit" className="cbtn c-yellow" disabled={loading || !input.trim()}>
          Ask
        </button>
      </form>
      <p className="muted mt-2 text-xs">
        Astro is an AI helper and can make mistakes. Check its sources, and never share personal information like your name,
        address or school.
      </p>
    </div>
  )
}
