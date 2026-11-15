import { useCallback, useEffect, useState } from 'react'
import { clearProgress, emptyProgress, loadProgress, PROGRESS_EVENT, saveProgress, STORAGE_KEY, type Progress } from './progress'

/** Saved game progress as React state. Saves on every change and follows changes made in other tabs and by the account sync. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setProgress(loadProgress())
    }
    // Another part of this page saved (for example, stars arriving from the account).
    const onSave = () =>
      setProgress((prev) => {
        const now = loadProgress()
        return JSON.stringify(now) === JSON.stringify(prev) ? prev : now
      })
    window.addEventListener('storage', onStorage)
    window.addEventListener(PROGRESS_EVENT, onSave)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(PROGRESS_EVENT, onSave)
    }
  }, [])

  const update = useCallback((change: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = change(prev)
      if (next !== prev) saveProgress(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    clearProgress()
    setProgress(emptyProgress())
  }, [])

  return { progress, update, reset }
}
