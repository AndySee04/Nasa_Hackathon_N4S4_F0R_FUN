"""A5: real NASA photos for "show me…" questions, with no network in tests."""

import pytest

from app.config import Settings
from app.models import PageContext
from app.services import images as images_module
from app.services.ai_service import PHOTOS_ONLY, AstroService
from app.services.cache import AnswerCache
from app.services.images import image_cache, parse_results, search_nasa_images
from app.services.knowledge_service import get_knowledge_base


def nasa_item(nasa_id: str, title: str, href: str, **data) -> dict:
    return {
        "data": [{"nasa_id": nasa_id, "title": title, "media_type": "image", **data}],
        "links": [{"href": href, "render": "image"}],
    }


SAMPLE = {
    "collection": {
        "items": [
            {
                "data": [{"nasa_id": "vid1", "media_type": "video"}],
                "links": [{"href": "https://images-assets.nasa.gov/v~thumb.jpg", "render": "image"}],
            },
            nasa_item("bad", "Elsewhere", "https://evil.example.com/x~thumb.jpg"),
            nasa_item(
                "PIA1",
                "Saturn's rings",
                "https://images-assets.nasa.gov/image/PIA1/PIA1~thumb.jpg",
                secondary_creator="NASA/JPL-Caltech/SSI",
            ),
            nasa_item("PIA2", "Saturn at equinox", "http://images-assets.nasa.gov/image/PIA2/PIA2~thumb.jpg"),
            nasa_item("PIA3", "Saturn from Cassini", "https://images-assets.nasa.gov/image/PIA3/PIA3~thumb.jpg", center="JPL"),
            nasa_item("PIA4", "Extra", "https://images-assets.nasa.gov/image/PIA4/PIA4~thumb.jpg"),
        ]
    }
}


class FakeImages:
    def __init__(self, body=SAMPLE, fail=False):
        self.body, self.fail, self.queries = body, fail, []

    async def get(self, url, params):
        self.queries.append(params["q"])
        if self.fail:
            raise RuntimeError("offline")
        body = self.body
        return type("R", (), {"raise_for_status": lambda self: None, "json": lambda self: body})()


@pytest.fixture(autouse=True)
def _clean(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("NASA_IMAGES", "on")
    image_cache.clear()


def service(fake: FakeImages) -> AstroService:
    return AstroService(Settings(), get_knowledge_base(), cache=AnswerCache(), image_client=fake)  # type: ignore[arg-type]


def test_parse_keeps_only_nasa_https_photos_with_credit():
    photos = parse_results(SAMPLE)
    assert [p.title for p in photos] == ["Saturn's rings", "Saturn from Cassini"]
    assert photos[0].url == "https://images-assets.nasa.gov/image/PIA1/PIA1~medium.jpg"
    assert photos[0].credit == "NASA/JPL-Caltech/SSI" and photos[1].credit == "NASA JPL"
    assert photos[0].page_url == "https://images.nasa.gov/details/PIA1"


@pytest.mark.anyio
async def test_show_me_uses_the_documents_search_phrase_not_the_childs_words():
    fake = FakeImages()
    reply = await service(fake).chat("Show me a picture of Saturn's rings", [], PageContext())
    assert fake.queries == ["Saturn rings Cassini"]
    assert len(reply.images) == 2 and all(i.kind == "nasa_photo" for i in reply.images)
    assert reply.confidence == "sourced" and "ice" in reply.reply.lower()


@pytest.mark.anyio
async def test_photos_without_facts_say_so_honestly():
    fake = FakeImages()
    reply = await service(fake).chat("Show me a nebula", [], PageContext())
    assert fake.queries == ["nebula"]
    assert reply.reply == PHOTOS_ONLY and reply.confidence == "unsure" and reply.images


@pytest.mark.anyio
async def test_no_photos_unless_asked_and_failures_are_quiet():
    fake = FakeImages()
    await service(fake).chat("Why is Mars red?", [], PageContext())
    assert fake.queries == []
    broken = FakeImages(fail=True)
    reply = await service(broken).chat("Show me Mars", [], PageContext())
    assert reply.images == [] and "rust" in reply.reply.lower()


@pytest.mark.anyio
async def test_image_results_are_cached(monkeypatch):
    fake = FakeImages()
    await search_nasa_images("Mars globe", fake)
    await search_nasa_images("mars globe", fake)
    assert fake.queries == ["Mars globe"]


@pytest.mark.anyio
async def test_photos_can_be_switched_off(monkeypatch):
    monkeypatch.setenv("NASA_IMAGES", "off")
    fake = FakeImages()
    reply = await service(fake).chat("Show me Saturn's rings", [], PageContext())
    assert fake.queries == [] and reply.images == []
    assert images_module.MAX_IMAGES == 2
