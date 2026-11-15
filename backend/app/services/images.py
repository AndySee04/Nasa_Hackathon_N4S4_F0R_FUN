"""Real NASA photos for "show me…" questions (docs/specs/ai-cosmic-tutor.md §6).

Uses the public NASA Image and Video Library (images.nasa.gov, no key needed).
- Search phrases come from the knowledge base (a document's image_query) or from the
  classifier's fixed list of space words, never from a child's raw message.
- Only https links on nasa.gov hosts are returned.
- Results are cached for 24 hours; any error simply means no photos, never a failed answer.
- No image generation in v1.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from urllib.parse import quote, urlparse

import httpx

from app.services.cache import AnswerCache

log = logging.getLogger("astro.images")

SEARCH_URL = "https://images-api.nasa.gov/search"
MAX_IMAGES = 2
TIMEOUT_SECONDS = 5.0
image_cache: AnswerCache = AnswerCache(ttl_seconds=24 * 3600, max_entries=300)


@dataclass(frozen=True)
class NasaImage:
    url: str
    title: str
    credit: str
    page_url: str


def _nasa_https(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return url.startswith("https://") and (host == "nasa.gov" or host.endswith(".nasa.gov"))


def parse_results(body: dict, limit: int = MAX_IMAGES) -> list[NasaImage]:
    """Picks the first `limit` usable photos from an images-api.nasa.gov search response."""
    out: list[NasaImage] = []
    for item in body.get("collection", {}).get("items", []):
        data = (item.get("data") or [{}])[0]
        preview = next((link for link in item.get("links") or [] if link.get("render") == "image" and link.get("href")), None)
        nasa_id = data.get("nasa_id")
        if not nasa_id or not preview or data.get("media_type", "image") != "image":
            continue
        # Prefer the medium-size rendition; fall back to whatever preview was given.
        url = preview["href"].replace("~thumb.", "~medium.")
        if not _nasa_https(url):
            continue
        credit = (
            data.get("secondary_creator")
            or data.get("photographer")
            or (f"NASA {data['center']}" if data.get("center") else "NASA")
        )
        out.append(
            NasaImage(
                url=url,
                title=str(data.get("title", ""))[:120],
                credit=str(credit)[:80],
                page_url=f"https://images.nasa.gov/details/{quote(nasa_id)}",
            )
        )
        if len(out) == limit:
            break
    return out


async def search_nasa_images(query: str, client: httpx.AsyncClient | None = None, limit: int = MAX_IMAGES) -> list[NasaImage]:
    key = AnswerCache.key(query, str(limit))
    cached = image_cache.get(key)
    if cached is not None:
        return cached
    own = client is None
    http = client or httpx.AsyncClient(timeout=TIMEOUT_SECONDS)
    try:
        res = await http.get(SEARCH_URL, params={"q": query, "media_type": "image"})
        res.raise_for_status()
        images = parse_results(res.json(), limit)
    except Exception as exc:  # noqa: BLE001 - photos are a bonus; never break the answer
        log.info("NASA image search failed for %r: %s", query, type(exc).__name__)
        return []
    finally:
        if own:
            await http.aclose()
    image_cache.put(key, images)
    return images
