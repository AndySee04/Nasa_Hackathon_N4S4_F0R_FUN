import { useCallback, useEffect, useState } from 'react'
import { clearProgress, emptyProgress, loadProgress, saveProgress, STORAGE_KEY, type Progress } from './progress'

/** Saved game progress as React state. Saves on every change and follows changes made in other tabs. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setProgress(loadProgress())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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
