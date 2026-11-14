import { useCallback, useEffect, useState } from 'react'
import { getHealth, type AiMode } from '../services/api'

export type BackendStatus =
  | { state: 'checking' }
  | { state: 'online'; mode: AiMode }
  | { state: 'offline' }

/** Polls the FastAPI health endpoint so the UI can show an honest status badge. */
export function useBackendStatus(pollMs = 30000) {
  const [status, setStatus] = useState<BackendStatus>({ state: 'checking' })

  const check = useCallback(async () => {
    try {
      const health = await getHealth()
      setStatus({ state: 'online', mode: health.ai_mode })
    } catch {
      setStatus({ state: 'offline' })
    }
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, pollMs)
    return () => clearInterval(id)
  }, [check, pollMs])

  return { status, recheck: check }
}
