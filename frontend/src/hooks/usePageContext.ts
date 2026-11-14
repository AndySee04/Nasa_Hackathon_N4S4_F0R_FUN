import { useEffect } from 'react'
import { useAstro } from '../context/AstroContext'

/** Tells Astro AI which page (and artifact) the child is looking at, for context-aware answers. */
export function usePageContext(page: string, artifactId?: string) {
  const { setPageContext } = useAstro()
  useEffect(() => {
    setPageContext({ page, artifactId })
  }, [page, artifactId, setPageContext])
}
