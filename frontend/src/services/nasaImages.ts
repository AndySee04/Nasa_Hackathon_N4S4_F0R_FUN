/**
 * NASA Image and Video Library (https://images.nasa.gov) — public API, no key needed.
 * We search once per artifact and cache the result for the session.
 */

export interface NasaImage {
  url: string
  title: string
  nasaId: string
  center?: string
  pageUrl: string
}

const cache = new Map<string, Promise<NasaImage | null>>()

interface SearchResponse {
  collection?: {
    items?: Array<{
      data?: Array<{ title?: string; nasa_id?: string; center?: string; media_type?: string }>
      links?: Array<{ href?: string; rel?: string; render?: string }>
    }>
  }
}

async function search(query: string): Promise<NasaImage | null> {
  const url = `https://images-api.nasa.gov/search?${new URLSearchParams({ q: query, media_type: 'image' })}`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = (await res.json()) as SearchResponse
  for (const item of json.collection?.items ?? []) {
    const data = item.data?.[0]
    const preview = item.links?.find((l) => l.render === 'image' && l.href)
    if (data?.nasa_id && preview?.href) {
      return {
        // Prefer the medium-size rendition when the preview is a thumbnail.
        url: preview.href.replace('~thumb.', '~medium.'),
        title: data.title ?? query,
        nasaId: data.nasa_id,
        center: data.center,
        pageUrl: `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`,
      }
    }
  }
  return null
}

export function findNasaImage(query: string): Promise<NasaImage | null> {
  if (!cache.has(query)) {
    cache.set(query, search(query).catch(() => null))
  }
  return cache.get(query)!
}
