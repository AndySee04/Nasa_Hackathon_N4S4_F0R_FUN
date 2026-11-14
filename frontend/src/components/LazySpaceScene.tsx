import { lazy } from 'react'

/** three.js is large, so the 3D scene is split into its own chunk and loaded after the page text. */
export const SpaceScene = lazy(() => import('./SpaceScene'))

export function SceneFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-space-950 ${className}`} role="status">
      <div className="h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-amber/70 to-orange-600/40 blur-[1px]" />
      <span className="sr-only">Loading the 3D solar system…</span>
    </div>
  )
}
