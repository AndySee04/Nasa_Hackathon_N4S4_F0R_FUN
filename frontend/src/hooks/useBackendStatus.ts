import { useCallback, useEffect, useRef, useState } from 'react'
import { getHealth, type AiMode } from '../services/api'

export type BackendStatus = { state: 'checking' } | { state: 'online'; mode: AiMode } | { state: 'offline' }

async function probe(): Promise<BackendStatus> {
  try {
    const health = await getHealth()
    return { state: 'online', mode: health.ai_mode }
  } catch {
    return { state: 'offline' }
  }
}

/** Polls the FastAPI health endpoint so the UI can show an honest status badge. */
export function useBackendStatus(pollMs = 30000) {
  const [status, setStatus] = useState<BackendStatus>({ state: 'checking' })
  const alive = useRef(true)

  const recheck = useCallback(() => {
    void probe().then((s) => alive.current && setStatus(s))
  }, [])

  useEffect(() => {
    alive.current = true
    const run = () => void probe().then((s) => alive.current && setStatus(s))
    const first = setTimeout(run, 0)
    const id = setInterval(run, pollMs)
    return () => {
      alive.current = false
      clearTimeout(first)
      clearInterval(id)
    }
  }, [pollMs])

  return { status, recheck }
}
