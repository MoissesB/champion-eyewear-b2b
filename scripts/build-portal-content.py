"""Build the portal catalog from the owner-supplied CONTENIDO PORTAL folder."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import av
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "Downloads" / "CONTENIDO PORTAL"
UPLOADS = ROOT / "clientes" / "portal-content-uploads.json"
OUTPUT = ROOT / "clientes" / "portal-content.json"
POSTERS = ROOT / "assets" / "client-video-posters"
MEDIA = "https://assets.cdn.filesafe.space/itkQlAHHVlUS0uDAETp3/media/"


def bilingual(es: str, en: str) -> dict[str, str]:
    return {"es": es, "en": en}


def date_label(timestamp: str) -> str:
    return datetime.fromtimestamp(int(timestamp), timezone.utc).strftime("%d/%m/%Y")


def video_title(name: str, ordinal: int) -> dict[str, str]:
    numbered = re.match(r"Champion_(\d+)_", name)
    if numbered:
        number = numbered.group(1)
        version = re.search(r"_v(\d+)", name)
        suffix_es = f" · versión {version.group(1)}" if version else ""
        suffix_en = f" · version {version.group(1)}" if version else ""
        if "SIN_BUCLE" in name:
            suffix_es += " sin bucle"
            suffix_en += " without loop"
        return bilingual(f"Champion · video {number}{suffix_es}", f"Champion · video {number}{suffix_en}")
    dated = re.match(r"champion_innova_(\d+)_", name)
    if dated:
        label = date_label(dated.group(1))
        return bilingual(f"Champion · video {label}", f"Champion · video {label}")
    if "horizontal_QR_YouTube" in name:
        return bilingual("Champion · video horizontal con QR", "Champion · horizontal video with QR")
    return bilingual(f"Champion · video adicional {ordinal}", f"Champion · additional video {ordinal}")


def video_dimensions_and_poster(path: Path, poster: Path) -> tuple[int, int]:
    with av.open(str(path)) as container:
        stream = container.streams.video[0]
        width, height = stream.width, stream.height
        frame_image = None
        for frame in container.decode(stream):
            frame_image = frame.to_image().convert("RGB")
            if frame.time is not None and frame.time >= 1.0:
                break
        if frame_image is None:
            raise ValueError(f"No readable video frame: {path.name}")
        frame_image.thumbnail((480, 480), Image.Resampling.LANCZOS)
        poster.parent.mkdir(parents=True, exist_ok=True)
        frame_image.save(poster, quality=82, optimize=True)
        return width, height


def main() -> None:
    mapped = json.loads(UPLOADS.read_text(encoding="utf-8"))["items"]
    assert len(mapped) == 86
    assert len({item["name"] for item in mapped}) == len({item["id"] for item in mapped}) == 86
    assert {item["name"] for item in mapped} == {p.name for p in SOURCE.iterdir() if p.is_file()}

    grouped: dict[str, list[str]] = defaultdict(list)
    for item in mapped:
        if item["name"].lower().endswith(".jpg") and item["name"] != "Logo champions.jpg":
            match = re.match(r"champion_innova_(\d+)_", item["name"])
            assert match, item["name"]
            grouped[match.group(1)].append(item["name"])
    image_positions = {
        name: (timestamp, index + 1, len(names))
        for timestamp, names in grouped.items()
        for index, name in enumerate(sorted(names))
    }

    result = {"sourceFolder": "CONTENIDO PORTAL", "images": [], "videos": [], "logos": []}
    extra_video = 0
    for item in mapped:
        name, media_id = item["name"], item["id"]
        path = SOURCE / name
        assert path.is_file() and path.stat().st_size > 0, name
        if name.lower().endswith(".jpg"):
            with Image.open(path) as source_image:
                image = ImageOps.exif_transpose(source_image)
                width, height = image.size
            url = f"{MEDIA}{media_id}.jpg"
            if name == "Logo champions.jpg":
                result["logos"].append({
                    "id": f"portal-logo-{media_id}", "name": name, "url": url,
                    "width": width, "height": height,
                    "title": bilingual("Logo Champion · contenido portal", "Champion logo · portal content"),
                })
            else:
                timestamp, position, total = image_positions[name]
                date = date_label(timestamp)
                result["images"].append({
                    "id": f"portal-image-{media_id}", "name": name, "type": "image", "url": url,
                    "width": width, "height": height,
                    "title": bilingual(
                        f"Contenido Champion · {date} · imagen {position}/{total}",
                        f"Champion content · {date} · image {position}/{total}",
                    ),
                    "description": bilingual("Imagen Champion para compartir o descargar.",
                                              "Champion image to share or download."),
                })
        elif name.lower().endswith(".mp4"):
            if not re.match(r"(?:Champion_\d+_|champion_innova_)", name, re.I) and "horizontal_QR_YouTube" not in name:
                extra_video += 1
            video_id = f"portal-video-{media_id}"
            width, height = video_dimensions_and_poster(path, POSTERS / f"{video_id}.jpg")
            result["videos"].append({
                "id": video_id, "name": name, "url": f"{MEDIA}{media_id}.mp4",
                "width": width, "height": height,
                "title": video_title(name, extra_video),
                "description": bilingual("Video Champion disponible para visualizar y descargar.",
                                         "Champion video available to view and download."),
                "language": "unknown",
            })
        else:
            raise ValueError(f"Unsupported file: {name}")

    assert {key: len(value) for key, value in result.items() if isinstance(value, list)} == {
        "images": 50, "videos": 35, "logos": 1,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"portal-content: {len(result['images'])} images, {len(result['videos'])} videos, {len(result['logos'])} logo")


if __name__ == "__main__":
    main()
