import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAstro } from '../context/AstroContext'
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
    checking: { dot: 'bg-amber animate-pulse', text: 'Checking Astro AI server…' },
    online: {
      dot: 'bg-status-operational',
      text: backend.state === 'online' && backend.mode === 'llm' ? 'Astro AI online · AI model connected' : 'Astro AI online · knowledge mode (no AI model key set)',
    },
    offline: { dot: 'bg-status-lost', text: 'Astro AI server offline' },
  } as const
  const s = map[backend.state]
  return (
    <div className="flex items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden="true" />
      <span>{s.text}</span>
      {backend.state === 'offline' && (
        <button type="button" className="underline hover:text-cyan" onClick={recheckBackend}>
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <BackendBadge />
        {messages.length > 1 && (
          <button type="button" onClick={reset} className="text-sm text-muted underline hover:text-cyan">
            New chat
          </button>
        )}
      </div>
      {contextArtifact && (
        <p className="mt-3 rounded-2xl bg-cyan/10 px-3 py-2 text-sm text-cyan">
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
              className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                m.role === 'user'
                  ? 'rounded-br-md bg-gradient-to-br from-cyan/30 to-violet/30 text-ink'
                  : m.error
                    ? 'rounded-bl-md border border-status-lost/40 bg-status-lost/10'
                    : 'rounded-bl-md bg-white/[0.07]'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
              {m.safetyNote && <p className="mt-2 text-sm text-amber">🛡️ {m.safetyNote}</p>}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="text-sm font-semibold text-muted">Where this comes from:</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {m.sources.map((s) => (
                      <li key={s.url + s.title}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cyan underline">
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
            <p className="rounded-3xl rounded-bl-md bg-white/[0.07] px-4 py-3 text-muted">Astro is thinking…</p>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-muted">{messages.length <= 1 ? 'Try asking:' : 'Explore further:'}</p>
          <div className="flex flex-wrap gap-2">
            {chips.slice(0, 4).map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void send(q)}
                className="chip border-violet/40 bg-violet/10 text-left text-ink hover:bg-violet/20 disabled:opacity-50"
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
          className="min-h-12 flex-1 rounded-full border border-white/15 bg-space-950/60 px-5 text-ink placeholder:text-muted/70 focus:border-cyan focus:outline-none"
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          Ask
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">
        Astro is an AI helper and can make mistakes. Check its sources, and never share personal information like your name,
        address or school.
      </p>
    </div>
  )
}
