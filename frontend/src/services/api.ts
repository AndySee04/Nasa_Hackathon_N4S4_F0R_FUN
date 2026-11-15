/**
 * REST client for the FastAPI backend (Astro AI).
 * The backend URL comes from VITE_API_URL. No API keys ever live in the frontend.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8000'

export type AiMode = 'llm' | 'knowledge'

export interface HealthResponse {
  status: 'ok'
  ai_mode: AiMode
  artifacts_loaded: number
}

export interface AstroSource {
  title: string
  url: string
}

export interface AstroReply {
  reply: string
  sources: AstroSource[]
  suggestions: string[]
  /** 'cache' means the same question was answered recently. */
  mode: AiMode | 'cache'
  /** Set when the safety filter changed or refused the request. */
  safety_note?: string | null
  /** Which part of the knowledge base answered (docs/specs/contract-game-ai.md). */
  topic?: 'solar_system' | 'missions' | 'deep_space' | 'general' | 'blocked' | null
  /** 'unsure' means Astro had no reliable NASA-sourced facts and said so. */
  confidence?: 'sourced' | 'general_knowledge' | 'unsure' | null
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AstroContextInfo {
  page?: string
  artifactId?: string
  /** Game context (docs/specs/contract-game-ai.md). */
  campaign?: 'moon'
  stage?: 'landing' | 'catch' | 'discovery' | 'repair' | 'science' | 'quiz' | 'complete'
  /** Up to 10 questions already asked, so Astro doesn't suggest them again. */
  askedQuestions?: string[]
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 30000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: controller.signal,
    })
    if (!res.ok) {
      let detail = `Request failed (${res.status})`
      try {
        const body = await res.json()
        if (typeof body?.detail === 'string') detail = body.detail
      } catch {
        /* response had no JSON body */
      }
      throw new ApiError(detail, res.status)
    }
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Astro took too long to answer. Please try again.', 408)
    }
    throw new ApiError('Cannot reach the Astro AI server.', 0)
  } finally {
    clearTimeout(timer)
  }
}

export const getHealth = () => request<HealthResponse>('/api/health', undefined, 5000)

export const sendChat = (message: string, history: ChatTurn[], context: AstroContextInfo) =>
  request<AstroReply>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history: history.slice(-6), context }),
  })

export const explainTerm = (term: string, context: AstroContextInfo) =>
  request<AstroReply>('/api/ai/explain', {
    method: 'POST',
    body: JSON.stringify({ term, context }),
  })

export const getSuggestedQuestions = (context: AstroContextInfo) => {
  const params = new URLSearchParams()
  if (context.page) params.set('page', context.page)
  if (context.artifactId) params.set('artifact_id', context.artifactId)
  return request<{ questions: string[] }>(`/api/ai/suggested-questions?${params}`, undefined, 5000)
}
