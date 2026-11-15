import { useLayoutEffect, useRef } from 'react'

/** Deterministic random, so each piece keeps the same edge on every render. */
function rng(seed: number) {
  return () => (seed = (seed * 9301 + 49297) % 233280) / 233280
}
const hash = (s: string) => s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 233280, 13)

/** Gives an element a slightly jagged, scissor-cut outline that follows its size. */
export function useCutEdges<T extends HTMLElement>(seedKey: string) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const cut = () => {
      const rand = rng(hash(seedKey))
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      const j = 5
      const step = 34
      const pts: [number, number][] = []
      for (let x = 0; x < w; x += step) pts.push([x, rand() * j])
      for (let y = 0; y < h; y += step) pts.push([w - rand() * j, y])
      for (let x = w; x > 0; x -= step) pts.push([x, h - rand() * j])
      for (let y = h; y > 0; y -= step) pts.push([rand() * j, y])
      el.style.clipPath = `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`
    }
    cut()
    const ro = new ResizeObserver(cut)
    ro.observe(el)
    return () => ro.disconnect()
  }, [seedKey])
  return ref
}
