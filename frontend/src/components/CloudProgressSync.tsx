import { useEffect, useRef } from 'react'
import { fetchCloudProgress, saveCloudProgress } from '../game/cloudProgress'
import { emptyProgress, loadProgress, mergeProgress, PROGRESS_EVENT, sameStars, saveProgress } from '../game/progress'
import { useAuth } from '../hooks/useAuth'
import { getSupabase } from '../lib/supabase'

/** Wait this long after the last change before saving to the account, so a burst of changes is one save. */
const SAVE_DELAY_MS = 1500

/**
 * Keeps game stars in the signed-in grown-up's account. Draws nothing.
 * - Signing in: the stars in this browser and in the account are merged (best result for every machine),
 *   and both copies get the merged stars, so nothing is lost either way.
 * - While signed in: each change is saved to the account shortly after it happens.
 * - Signing out: the stars are cleared from this browser (they are safe in the account), so the next
 *   explorer on a shared computer starts fresh. Settings such as easy mode stay.
 * If the account can't be reached, the game carries on with the browser copy.
 */
export default function CloudProgressSync() {
  const { status, user } = useAuth()
  const userId = user?.id ?? null
  const before = useRef(status)

  useEffect(() => {
    const was = before.current
    before.current = status
    if (was === 'signed-in' && status === 'signed-out') saveProgress({ ...emptyProgress(), settings: loadProgress().settings })
  }, [status])

  useEffect(() => {
    if (status !== 'signed-in' || !userId) return
    let alive = true
    let ready = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const push = () => {
      timer = undefined
      getSupabase()
        .then((supabase) => saveCloudProgress(supabase, userId, loadProgress()))
        .catch(() => undefined) // Offline or not set up: the browser copy still has everything.
    }

    getSupabase()
      .then(async (supabase) => {
        const cloud = await fetchCloudProgress(supabase, userId)
        if (!alive) return
        const local = loadProgress()
        const merged = cloud ? mergeProgress(local, cloud) : local
        if (!sameStars(merged, local)) saveProgress(merged)
        if (!cloud || !sameStars(merged, cloud)) await saveCloudProgress(supabase, userId, merged)
        // Only now start saving changes. If the first merge failed, saving this browser's copy could
        // overwrite stars that only the account has, so this visit stays browser-only instead.
        ready = alive
      })
      .catch(() => undefined)

    const onChange = () => {
      if (!ready) return
      clearTimeout(timer)
      timer = setTimeout(push, SAVE_DELAY_MS)
    }
    // Leaving the page or switching tabs: save now rather than lose the last change.
    const onHide = () => {
      if (document.visibilityState === 'hidden' && timer) {
        clearTimeout(timer)
        push()
      }
    }
    window.addEventListener(PROGRESS_EVENT, onChange)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      alive = false
      clearTimeout(timer)
      window.removeEventListener(PROGRESS_EVENT, onChange)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [status, userId])

  return null
}
