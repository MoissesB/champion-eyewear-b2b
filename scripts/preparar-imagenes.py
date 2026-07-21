import json
import os
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps


repo_root = Path(__file__).resolve().parent.parent
manifest_path = repo_root / "data" / "asset-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))


def prepare(asset):
    source = Path(asset["source"])
    target = repo_root / asset["target"]
    target.parent.mkdir(parents=True, exist_ok=True)
    original_size = source.stat().st_size

    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return 0, original_size, target.stat().st_size

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
        image = image.convert("RGBA" if has_alpha else "RGB")
        image.thumbnail(
            (int(asset.get("maxWidth", 1500)), int(asset.get("maxHeight", 1100))),
            Image.Resampling.LANCZOS,
        )
        image.save(target, "WEBP", quality=83, method=4)

    return 1, original_size, target.stat().st_size


if __name__ == "__main__":
    workers = min(8, max(2, os.cpu_count() or 2))
    with ProcessPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(prepare, manifest, chunksize=4))

    processed = sum(result[0] for result in results)
    total_original = sum(result[1] for result in results)
    total_web = sum(result[2] for result in results)

    print(
        f"Imágenes nuevas: {processed}; total {len(manifest)}; "
        f"originales {total_original / 1024 / 1024:.1f} MB; "
        f"web {total_web / 1024 / 1024:.1f} MB."
    )
