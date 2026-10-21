"""Extract compact, correctly oriented preview frames from public Champion videos."""

from __future__ import annotations

from pathlib import Path

import av
from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "output" / "client-portal"
TARGET = ROOT / "assets" / "client-video-posters"


def poster(source: Path, target: Path) -> None:
    best: Image.Image | None = None
    best_score = -1.0
    with av.open(str(source)) as container:
        stream = container.streams.video[0]
        for index, frame in enumerate(container.decode(stream)):
            seconds = float(frame.time or 0)
            if index % 8 and seconds < 5:
                continue
            picture = frame.to_image().convert("RGB")
            picture.thumbnail((480, 480), Image.Resampling.LANCZOS)
            stats = ImageStat.Stat(picture.convert("L"))
            # Favor a readable scene over a blank white intro or a black frame.
            score = stats.stddev[0] * 2 + stats.mean[0] * (1 - stats.mean[0] / 255)
            if score > best_score:
                best, best_score = picture, score
            if seconds >= 5:
                break
    if best is None:
        raise RuntimeError(f"No video frames: {source}")
    # Raise very dark opening scenes gently so their preview is legible.
    if ImageStat.Stat(best.convert("L")).mean[0] < 55:
        best = best.point([min(255, round(255 * (value / 255) ** .68)) for value in range(256)] * 3)
    target.parent.mkdir(parents=True, exist_ok=True)
    best.save(target, "JPEG", quality=82, optimize=True)


def main() -> None:
    originals = [*sorted((SOURCE / "videos").glob("*.mp4")),
                 *sorted((SOURCE / "instagram-export-part1").glob("*.mp4"))]
    assert len(originals) == 83
    for source in originals:
        poster(source, TARGET / f"{source.stem}.jpg")
    print(f"video-posters: {len(originals)} files")


if __name__ == "__main__":
    main()
