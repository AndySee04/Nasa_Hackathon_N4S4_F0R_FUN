import { useContext } from 'react'
import { AstroCtx, type AstroState } from '../context/astroState'

/** Access Astro AI's shared chat state from any component. */
export function useAstro(): AstroState {
  const ctx = useContext(AstroCtx)
  if (!ctx) throw new Error('useAstro must be used inside <AstroProvider>')
  return ctx
}
