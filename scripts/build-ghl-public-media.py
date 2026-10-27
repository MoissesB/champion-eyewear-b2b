"""Build the browser manifest for assets Champion has already published.

The three input maps are local observations of Champion's GoHighLevel Media
Storage. The output contains only CDN URLs for publicly published materials.
"""

from __future__ import annotations

import json
from pathlib import Path

import av

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "output" / "client-portal"

# Videos retirados de la galería por indicación del propietario (filtro Español,
# posiciones 17 a 26 el 2026-10-21). Se conservan en el inventario de origen.
HIDDEN_INSTAGRAM_VIDEO_IDS = {
    "post-17880058548496463",
    "post-17901658173494547",
    "post-17982979257058079",
    "post-18010661402940194",
    "post-18022106066898343",
    "post-18055841018525459",
    "post-18083418266446797",
    "post-18102217640332636",
    "post-18104443418126927",
    "post-18108490075832026",
}


def read_map(name: str) -> dict:
    return json.loads((OUTPUT / name).read_text(encoding="utf-8"))


def dimensions(path: Path) -> dict:
    if path.suffix.lower() in {".jpg", ".jpeg", ".webp", ".png"}:
        from PIL import Image
        with Image.open(path) as image:
            width, height = image.size
    else:
        with av.open(str(path)) as media:
            stream = media.streams.video[0]
            width, height = stream.width, stream.height
    return {"width": width, "height": height,
            "orientation": "vertical" if height > width else "horizontal" if width > height else "square"}


def main() -> None:
    catalog = json.loads((ROOT / "clientes" / "media-catalog.json").read_text(encoding="utf-8"))
    images = {item["name"]: item["url"] for item in read_map("ghl-catalog-map.json")["items"]}
    videos = {item["name"]: item["url"] for item in read_map("ghl-video-map.json")["items"]}
    instagram = read_map("ghl-instagram-map.json")["items"]
    assert HIDDEN_INSTAGRAM_VIDEO_IDS <= {
        Path(item["name"]).stem for item in instagram if item["name"].lower().endswith(".mp4")
    }
    expected_images = {image["web"]["name"] for product in catalog["products"] for image in product["images"]}
    expected_videos = {f'{video["id"]}.mp4' for video in catalog["videos"]}
    assert len(images) == len(expected_images) == 580 and images.keys() == expected_images
    assert len(videos) == len(expected_videos) == 29 and videos.keys() == expected_videos
    assert len(instagram) == 71 and len({item["name"] for item in instagram}) == 71
    public = {
        "version": 1,
        "source": "Champion GoHighLevel Media Storage",
        "notice": "Direct CDN URLs are public; only previously published digital media is included.",
        "catalogImages": {image["id"]: images[image["web"]["name"]] for product in catalog["products"] for image in product["images"]},
        "videos": {video["id"]: videos[f'{video["id"]}.mp4'] for video in catalog["videos"]},
        "videoDimensions": {video["id"]: dimensions(OUTPUT / "videos" / f'{video["id"]}.mp4') for video in catalog["videos"]},
        "instagram": [
            {
                "id": Path(item["name"]).stem,
                "name": item["name"],
                "type": "video" if item["name"].lower().endswith(".mp4") else "image",
                "url": item["url"],
                **({"hidden": True} if Path(item["name"]).stem in HIDDEN_INSTAGRAM_VIDEO_IDS else {}),
                **dimensions(OUTPUT / "instagram-export-part1" / item["name"]),
            }
            for item in sorted(instagram, key=lambda item: item["name"])
        ],
    }
    assert len(public["catalogImages"]) == 580 and len(public["videos"]) == 29
    assert all(item["url"].startswith("https://assets.cdn.filesafe.space/itkQlAHHVlUS0uDAETp3/media/") for item in instagram)
    target = ROOT / "clientes" / "ghl-public-media.json"
    target.write_text(json.dumps(public, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"ghl-public-media: {len(public['catalogImages'])} images, {len(public['videos'])} videos, {len(public['instagram'])} Instagram files")


if __name__ == "__main__":
    main()
