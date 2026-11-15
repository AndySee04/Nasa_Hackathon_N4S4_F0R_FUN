import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
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

/** Is Astro reachable? One word for children; the technical detail is in the tooltip for grown-ups. */
export function StatusPill() {
  const { backend, recheckBackend } = useAstro()
  const s = {
    checking: { dot: 'bg-yellow animate-pulse', word: 'Connecting…', detail: 'Checking the Astro AI server.' },
    waking: { dot: 'bg-yellow animate-pulse', word: 'Waking up…', detail: 'The Astro AI server is starting. This can take up to a minute.' },
    online: {
      dot: 'bg-status-operational',
      word: 'Online',
      detail:
        backend.state === 'online' && backend.mode === 'llm'
          ? 'Online. Answers are written by an AI model from checked NASA facts.'
          : "Online. Answers come straight from the museum's checked NASA facts (no AI model connected).",
    },
    offline: { dot: 'bg-status-lost', word: 'Offline', detail: 'The Astro AI server is not answering.' },
  }[backend.state]
  return (
    <span className="muted inline-flex items-center gap-1.5 font-display text-sm" role="status" aria-live="polite" title={s.detail}>
      <span className={`h-2.5 w-2.5 rounded-full border-2 border-ink/60 ${s.dot}`} aria-hidden="true" />
      {s.word}
      <span className="sr-only"> · {s.detail}</span>
      {backend.state === 'offline' && (
        <button type="button" className="link ml-1" onClick={recheckBackend}>
          Try again
        </button>
      )}
    </span>
  )
}

/** Clears the conversation. Only shown once there is something to clear. */
export function NewChatButton() {
  const { messages, reset } = useAstro()
  if (messages.length <= 1) return null
  return (
    <button type="button" onClick={reset} className="sticker c-white btn btn-sm min-h-10! px-3!" style={{ '--r': '-1deg' } as React.CSSProperties}>
      New chat
    </button>
  )
}

/**
 * The conversation with Astro, used in the side panel and on the full page.
 * `toolbar` shows the status and "New chat" row; the side panel puts those in its own header instead.
 */
export default function ChatBot({ compact = false, toolbar = true }: { compact?: boolean; toolbar?: boolean }) {
  const { messages, loading, send, pageContext, backend } = useAstro()
  const [input, setInput] = useState('')
  const [starters, setStarters] = useState<string[]>(FALLBACK_QUESTIONS)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const contextArtifact = artifactById(pageContext.artifactId)

  // Show each new answer from its first line, not its last: children read top-down, and jumping to the
  // bottom (the sources) made them scroll back up after every answer. Their own question and the
  // "thinking" bubble still go to the bottom, where they appear.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto'
    const last = messages[messages.length - 1]
    if (loading || last?.role === 'user') {
      list.scrollTo({ top: list.scrollHeight, behavior })
    } else if (messages.length > 1) {
      const el = list.querySelector<HTMLElement>(`[data-msg="${last.id}"]`)
      if (el) list.scrollTo({ top: el.offsetTop - 8, behavior })
    }
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

  const ask = (text: string) => {
    void send(text)
    // Keep the cursor in the box so the next question can be typed straight away.
    inputRef.current?.focus()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = input
    setInput('')
    ask(text)
  }

  const lastSuggestions = [...messages].reverse().find((m) => m.role === 'assistant' && m.suggestions?.length)?.suggestions
  const chips = (messages.length <= 1 ? starters : (lastSuggestions ?? [])).slice(0, 4)
  const waking = backend.state === 'waking' || backend.state === 'checking'

  return (
    <div className="flex h-full min-h-0 flex-col">
      {toolbar && (
        <div className="flex items-center justify-between gap-2 pb-2">
          <StatusPill />
          <NewChatButton />
        </div>
      )}
      {contextArtifact && (
        <p className="label c-sky mb-2 self-start text-sm">
          Astro knows you are looking at <strong>{contextArtifact.name}</strong>.
        </p>
      )}

      <div
        ref={listRef}
        className="relative min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain border-t-2 border-dashed border-ink/20 pr-1 pt-3"
        aria-live="polite"
        aria-label="Conversation with Astro"
      >
        {messages.map((m) => (
          <div key={m.id} data-msg={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <AstroAvatar className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0`} />}
            <div
              className={`max-w-[88%] rounded-[22px] border-2 border-ink/80 px-4 py-3 ${
                m.role === 'user' ? 'rounded-br-md bg-sky' : m.error ? 'rounded-bl-md bg-orange/40' : 'rounded-bl-md bg-sticker'
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
                // One tap away rather than always open: the list took more room than many answers.
                <details className="sources mt-2 border-t-2 border-dashed border-ink/20 pt-2">
                  <summary className="muted cursor-pointer font-display text-sm">
                    Where this comes from ({m.sources.length})
                  </summary>
                  <ul className="mt-1 space-y-1 text-sm">
                    {m.sources.map((s) => (
                      <li key={s.url + s.title}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="link font-normal">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2.5">
            <AstroAvatar className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0`} thinking />
            <p className="muted rounded-[22px] rounded-bl-md border-2 border-ink/80 bg-sticker px-4 py-3">
              {waking ? 'Waking up… this can take up to a minute.' : 'Astro is thinking…'}
            </p>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        // One row that slides sideways, instead of three wrapped rows that took more room than the chat.
        <div className="chip-row -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2 pt-1" role="group" aria-label="Questions you could ask next">
          {chips.map((q) => (
            <button key={q} type="button" disabled={loading} onClick={() => ask(q)} className="chip sticker c-lilac shrink-0 whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-1 flex gap-2">
        <label htmlFor={compact ? 'astro-input-compact' : 'astro-input'} className="sr-only">
          Ask Astro a question
        </label>
        <input
          ref={inputRef}
          id={compact ? 'astro-input-compact' : 'astro-input'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          autoComplete="off"
          enterKeyHint="send"
          placeholder="Ask about a spacecraft or a space word…"
          className="min-h-12 min-w-0 flex-1 rounded-full border-[3px] border-ink/80 bg-sticker px-5 text-ink placeholder:text-ink-soft focus:border-ink focus:outline-dashed focus:outline-3 focus:outline-offset-2 focus:outline-ink"
        />
        <button type="submit" className="cbtn c-yellow" disabled={loading || !input.trim()}>
          Ask
        </button>
      </form>
      <p className="muted mt-1.5 text-xs">Astro can make mistakes. Never share your name, address or school.</p>
    </div>
  )
}
