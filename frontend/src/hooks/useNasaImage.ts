import { useEffect, useState } from 'react'
import { findNasaImage, type NasaImage } from '../services/nasaImages'

type State = { status: 'loading' } | { status: 'ready'; image: NasaImage } | { status: 'missing' }

export function useNasaImage(query: string | undefined): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    if (!query) {
      setState({ status: 'missing' })
      return
    }
    setState({ status: 'loading' })
    findNasaImage(query).then((image) => {
      if (alive) setState(image ? { status: 'ready', image } : { status: 'missing' })
    })
    return () => {
      alive = false
    }
  }, [query])

  return state
}
