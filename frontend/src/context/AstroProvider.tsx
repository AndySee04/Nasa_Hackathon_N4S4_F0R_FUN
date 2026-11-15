import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { ApiError, sendChat, type AstroContextInfo, type ChatTurn } from '../services/api'
import { AstroCtx, type AstroState, type ChatMessage } from './astroState'

const WELCOME: ChatMessage = {
  id: 0,
  role: 'assistant',
  content:
    "Hi, I'm Astro! 🚀 Ask me about any spacecraft, rover or space word you see in the museum. I'll explain it simply and show you where the facts come from.",
}

export function AstroProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [pageContext, setPageContext] = useState<AstroContextInfo>({})
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [loading, setLoading] = useState(false)
  const nextId = useRef(1)
  const { status: backend, recheck } = useBackendStatus()

  const send = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || loading) return
      const history: ChatTurn[] = messages
        .filter((m) => m.id !== 0 && !m.error)
        .map((m) => ({ role: m.role, content: m.content }))
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', content: message }])
      setLoading(true)
      try {
        const res = await sendChat(message, history, pageContext)
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: 'assistant',
            content: res.reply,
            sources: res.sources,
            images: res.images ?? [],
            suggestions: res.suggestions,
            safetyNote: res.safety_note,
          },
        ])
      } catch (err) {
        const offline = err instanceof ApiError && (err.status === 0 || err.status === 408)
        // A sleeping server takes up to a minute to start: say so, instead of sounding broken.
        const starting = offline && backend.state !== 'online' && backend.state !== 'offline'
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: 'assistant',
            error: true,
            content: starting
              ? "I'm still waking up! That can take up to a minute. Please ask me again in a moment."
              : offline
                ? "I can't reach my mission control right now, so I can't answer. Ask a grown-up to check that the Astro AI server is running, then try again."
                : err instanceof Error
                  ? err.message
                  : 'Something went wrong. Please try again.',
          },
        ])
        if (offline) recheck()
      } finally {
        setLoading(false)
      }
    },
    [loading, messages, pageContext, recheck, backend.state],
  )

  const open = useCallback(
    (question?: string) => {
      setOpen(true)
      if (question) void send(question)
    },
    [send],
  )

  const value = useMemo<AstroState>(
    () => ({
      isOpen,
      open,
      close: () => setOpen(false),
      pageContext,
      setPageContext,
      messages,
      loading,
      send,
      reset: () => setMessages([WELCOME]),
      backend,
      recheckBackend: recheck,
    }),
    [isOpen, open, pageContext, messages, loading, send, backend, recheck],
  )

  return <AstroCtx.Provider value={value}>{children}</AstroCtx.Provider>
}

