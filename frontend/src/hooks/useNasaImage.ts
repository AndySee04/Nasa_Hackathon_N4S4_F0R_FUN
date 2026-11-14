import { useEffect, useState } from 'react'
import { findNasaImage, type NasaImage } from '../services/nasaImages'

type State = { status: 'loading' } | { status: 'ready'; image: NasaImage } | { status: 'missing' }

/** Looks up a photo in the NASA Image and Video Library for the given search phrase. */
export function useNasaImage(query: string | undefined): State {
  // Remember which query the result belongs to, so a new query shows "loading" without an extra render.
  const [result, setResult] = useState<{ query: string; image: NasaImage | null } | null>(null)

  useEffect(() => {
    if (!query) return
    let alive = true
    findNasaImage(query).then((image) => {
      if (alive) setResult({ query, image })
    })
    return () => {
      alive = false
    }
  }, [query])

  if (!query) return { status: 'missing' }
  if (result?.query !== query) return { status: 'loading' }
  return result.image ? { status: 'ready', image: result.image } : { status: 'missing' }
}
