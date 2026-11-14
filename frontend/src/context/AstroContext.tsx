import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBackendStatus, type BackendStatus } from '../hooks/useBackendStatus'
import { ApiError, sendChat, type AstroContextInfo, type AstroSource, type ChatTurn } from '../services/api'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: AstroSource[]
  suggestions?: string[]
  safetyNote?: string | null
  error?: boolean
}

interface AstroState {
  isOpen: boolean
  open: (question?: string) => void
  close: () => void
  pageContext: AstroContextInfo
  setPageContext: (ctx: AstroContextInfo) => void
  messages: ChatMessage[]
  loading: boolean
  send: (text: string) => Promise<void>
  reset: () => void
  backend: BackendStatus
  recheckBackend: () => void
}

const Ctx = createContext<AstroState | null>(null)

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
            suggestions: res.suggestions,
            safetyNote: res.safety_note,
          },
        ])
      } catch (err) {
        const offline = err instanceof ApiError && err.status === 0
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: 'assistant',
            error: true,
            content: offline
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
    [loading, messages, pageContext, recheck],
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

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAstro(): AstroState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAstro must be used inside <AstroProvider>')
  return ctx
}
