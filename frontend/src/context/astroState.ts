import { createContext } from 'react'
import type { BackendStatus } from '../hooks/useBackendStatus'
import type { AstroContextInfo, AstroSource } from '../services/api'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: AstroSource[]
  suggestions?: string[]
  safetyNote?: string | null
  error?: boolean
}

export interface AstroState {
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

export const AstroCtx = createContext<AstroState | null>(null)
