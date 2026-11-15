import { useCallback, useEffect, useRef, useState } from 'react'
import { getHealth, type AiMode } from '../services/api'

/**
 * - `waking`: the server isn't answering yet. On free hosting it sleeps when idle and takes up to a
 *   minute to start, so for the first couple of minutes we say "waking up" rather than "offline".
 */
export type BackendStatus = { state: 'checking' } | { state: 'waking' } | { state: 'online'; mode: AiMode } | { state: 'offline' }

/** How often to retry while the server is starting up, and for how long before calling it offline. */
const WAKE_RETRY_MS = 5000
const WAKE_WINDOW_MS = 120_000

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
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const failingSince = useRef<number | null>(null)

  const run = useCallback(
    async function tick(): Promise<void> {
      clearTimeout(timer.current)
      const result = await probe()
      if (!alive.current) return
      if (result.state === 'online') {
        failingSince.current = null
        setStatus(result)
        timer.current = setTimeout(() => void tick(), pollMs)
        return
      }
      failingSince.current ??= Date.now()
      if (Date.now() - failingSince.current < WAKE_WINDOW_MS) {
        setStatus({ state: 'waking' })
        timer.current = setTimeout(() => void tick(), WAKE_RETRY_MS)
      } else {
        setStatus({ state: 'offline' })
        timer.current = setTimeout(() => void tick(), pollMs)
      }
    },
    [pollMs],
  )

  useEffect(() => {
    alive.current = true
    timer.current = setTimeout(() => void run(), 0)
    return () => {
      alive.current = false
      clearTimeout(timer.current)
    }
  }, [run])

  /** Check again now. Starts a fresh "waking up" window, since asking again is what wakes the server. */
  const recheck = useCallback(() => {
    failingSince.current = null
    void run()
  }, [run])

  return { status, recheck }
}
