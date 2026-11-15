import { useEffect, useRef } from 'react'

/**
 * When `show` turns true, gently scrolls the returned element into view if it is off screen.
 * For a "next step" button that appears below a game on phones, so nobody has to go looking for it.
 */
export function useBringIntoView<T extends HTMLElement>(show: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!show) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const id = requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest' }))
    return () => cancelAnimationFrame(id)
  }, [show])
  return ref
}
