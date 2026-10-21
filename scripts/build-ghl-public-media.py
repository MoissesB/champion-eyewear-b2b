"""Build the browser manifest for assets Champion has already published.

The three input maps are local observations of Champion's GoHighLevel Media
Storage. The output contains only CDN URLs for publicly published materials.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "output" / "client-portal"


def read_map(name: str) -> dict:
    return json.loads((OUTPUT / name).read_text(encoding="utf-8"))


def main() -> None:
    catalog = json.loads((ROOT / "clientes" / "media-catalog.json").read_text(encoding="utf-8"))
    images = {item["name"]: item["url"] for item in read_map("ghl-catalog-map.json")["items"]}
    videos = {item["name"]: item["url"] for item in read_map("ghl-video-map.json")["items"]}
    instagram = read_map("ghl-instagram-map.json")["items"]
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
        "instagram": [
            {
                "id": Path(item["name"]).stem,
                "name": item["name"],
                "type": "video" if item["name"].lower().endswith(".mp4") else "image",
                "url": item["url"],
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
