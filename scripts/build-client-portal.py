"""Build the client portal inventory and private, per-model download packages.

The published JSON contains no local paths or Drive IDs. ZIPs are written to
ignored output/ and must be uploaded to a private Drive folder, never dist/.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
WORKSPACE = ROOT.parent
PUBLIC_MANIFEST = ROOT / "clientes" / "media-catalog.json"
PRIVATE_OUTPUT = ROOT / "output" / "client-portal"


def image_size(path: Path) -> tuple[int, int]:
    with Image.open(path) as picture:
        return picture.size


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def ch20_source(relative: str, web_file: Path) -> tuple[Path | None, str | None]:
    """Use the documented CH20 update only when its derived WebP is identical."""
    parts = Path(relative).parts
    if len(parts) < 5 or parts[-2] not in {f"ch20-c{n}" for n in range(1, 5)}:
        return None, None
    variant = parts[-2][-1]
    name = parts[-1]
    base = WORKSPACE / "Actualizacion_CH20_con_cristales_2026-09-09"
    derived = base / "DERIVADOS_WEB" / parts[-2] / name
    if not derived.is_file() or digest(derived) != digest(web_file):
        return None, None
    files = {1: "DIAGONAL-DERECHA", 2: "FRONTAL", 3: "DIAGONAL-IZQUIERDA", 4: "LATERAL-GENERADA"}
    view = 2 if name == "cover-v3.webp" else int(name[:2])
    suffix = files[view]
    if variant == "3" and view == 2:
        suffix = "FRONTAL-1"
    if variant == "4" and view == 2:
        suffix = "FRONTAL-GENERADA"
    source = base / f"C{variant}" / f"CH20_C{variant}_{suffix}.png"
    if not source.is_file():
        return None, None
    labels = {1: "Diagonal derecha", 2: "Frontal", 3: "Diagonal izquierda", 4: "Lateral"}
    return source, labels[view]


def description(product: dict, image_label: str, language: str) -> str:
    if language == "es":
        return (
            f"{image_label} de {product['displayModel']}, color {product['color']}. "
            f"{product['subline']} Modelo {product['sku']}; "
            f"material: {product['material']}; medidas: {product['measurements']}."
        )
    kind = "optical frame" if product["family"] == "optical" else "sunglasses"
    return (
        f"{image_label} of Champion {kind} {product['displayModel']}, "
        f"color {product['color']}, {product['collection']} collection. "
        f"SKU {product['sku']}; material: {product['material']}; "
        f"measurements: {product['measurements']}."
    )


def build_inventory() -> tuple[dict, dict]:
    products = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))["products"]
    source_manifest = json.loads((ROOT / "data" / "asset-manifest.json").read_text(encoding="utf-8"))
    sources = {item["target"]: Path(item["source"]) for item in source_manifest}
    catalog: dict = {"version": 1, "products": [], "videos": []}
    private: dict = {"models": {}, "videos": {}, "unmatchedOriginals": []}
    seen_paths: set[str] = set()

    for product in products:
        image_paths = list(dict.fromkeys([product["cover"], *product["images"]]))
        model = {
            "id": product["id"],
            "model": product["displayModel"],
            "sku": product["sku"],
            "family": product["family"],
            "collection": product["collection"],
            "series": product["series"],
            "color": product["color"],
            "material": product["material"],
            "measurements": product["measurements"],
            "description": {"es": product["subline"], "en": description(product, "Product", "en")},
            "images": [],
            "bundleFileId": None,
        }
        private_images: list[dict] = []
        for ordinal, relative in enumerate(image_paths, start=1):
            image_file = ROOT / relative
            if not image_file.is_file():
                raise FileNotFoundError(image_file)
            seen_paths.add(relative)
            role = "cover" if relative == product["cover"] else "view"
            view_number = product["images"].index(relative) + 1 if relative in product["images"] else 0
            label_es = "Portada" if role == "cover" else f"Vista {view_number:02d}"
            label_en = "Cover" if role == "cover" else f"View {view_number:02d}"
            original = sources.get(relative)
            if original and not original.is_file():
                original = None
            verified_angle = None
            if not original:
                original, verified_angle = ch20_source(relative, image_file)
            if verified_angle and role == "view":
                label_es = verified_angle
                label_en = {"Diagonal derecha": "Right diagonal", "Frontal": "Front", "Diagonal izquierda": "Left diagonal", "Lateral": "Side"}[verified_angle]
            width, height = image_size(image_file)
            item = {
                "id": f"{product['id']}-{ordinal:02d}",
                "role": role,
                "viewNumber": view_number,
                "label": {"es": label_es, "en": label_en},
                "description": {
                    "es": description(product, label_es, "es"),
                    "en": description(product, label_en, "en"),
                },
                "preview": f"/{relative}",
                "web": {"name": f"{product['id']}-{ordinal:02d}.webp", "width": width, "height": height, "bytes": image_file.stat().st_size, "driveFileId": None},
                "original": None,
            }
            if original:
                o_width, o_height = image_size(original)
                item["original"] = {
                    "name": f"{product['id']}-{ordinal:02d}-original{original.suffix.lower()}",
                    "width": o_width,
                    "height": o_height,
                    "bytes": original.stat().st_size,
                    "driveFileId": None,
                }
            else:
                private["unmatchedOriginals"].append(relative)
            model["images"].append(item)
            private_images.append({"id": item["id"], "web": str(image_file), "original": str(original) if original else None})
        catalog["products"].append(model)
        private["models"][model["id"]] = private_images

    if len(products) != 128 or len(seen_paths) != 580:
        raise ValueError(f"Catalog coverage changed: products={len(products)}, unique images={len(seen_paths)}")
    catalog["counts"] = {"products": len(products), "images": len(seen_paths), "originalsMatched": len(seen_paths) - len(private["unmatchedOriginals"])}
    video_candidates = sorted((WORKSPACE / "sources").glob("champion_innova_*.mp4"))
    video_candidates += sorted((WORKSPACE / "Instagram a YouTube Shorts" / "Todas las descargas de Instagram").glob("champion_innova_*.mp4"))
    video_candidates += sorted((WORKSPACE / "Champion publicar").glob("champion_innova_*.mp4"))
    video_candidates += sorted(WORKSPACE.glob("champion_innova_*.mp4"))
    video_candidates.append(ROOT / "assets" / "video" / "champion-hero.mp4")
    seen_digests: set[str] = set()
    for candidate in video_candidates:
        if not candidate.is_file():
            continue
        sha = digest(candidate)
        if sha in seen_digests:
            continue
        seen_digests.add(sha)
        video_id = f"champion-video-{len(catalog['videos']) + 1:02d}"
        staged = PRIVATE_OUTPUT / "videos" / f"{video_id}.mp4"
        staged.parent.mkdir(parents=True, exist_ok=True)
        if not staged.is_file() or digest(staged) != sha:
            shutil.copy2(candidate, staged)
        website = candidate == ROOT / "assets" / "video" / "champion-hero.mp4"
        title = {"es": "Video de portada Champion" if website else f"Video Champion {len(catalog['videos']) + 1:02d}",
                 "en": "Champion website hero video" if website else f"Champion video {len(catalog['videos']) + 1:02d}"}
        description_text = {"es": "Video utilizado en el sitio web oficial de Champion." if website else "Archivo de video Champion conservado en la biblioteca local de Instagram.",
                            "en": "Video used on the official Champion website." if website else "Champion video file from the local Instagram archive."}
        catalog["videos"].append({"id": video_id, "title": title, "description": description_text,
                                  "format": "MP4", "bytes": staged.stat().st_size,
                                  "preview": f"/output/client-portal/videos/{staged.name}"})
        private["videos"][video_id] = {"source": str(candidate), "staged": str(staged), "sha256": sha}
    catalog["counts"]["videos"] = len(catalog["videos"])
    return catalog, private


def write_bundle(model: dict, files: list[dict], destination: Path) -> dict:
    rows: list[dict] = []
    entries: list[tuple[Path, str]] = []
    for image, paths in zip(model["images"], files, strict=True):
        web = Path(paths["web"])
        entries.append((web, f"web/{image['web']['name']}"))
        original = Path(paths["original"]) if paths["original"] else None
        if original:
            entries.append((original, f"originales/{image['original']['name']}"))
        rows.append({
            "modelo": model["model"], "sku": model["sku"], "color": model["color"],
            "vista": image["label"]["es"], "descripcion": image["description"]["es"],
            "archivo_web": image["web"]["name"], "web_px": f"{image['web']['width']}x{image['web']['height']}",
            "archivo_original": image["original"]["name"] if original else "No identificado",
            "original_px": f"{image['original']['width']}x{image['original']['height']}" if original else "",
        })
    table = io.StringIO()
    writer = csv.DictWriter(table, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, "w", ZIP_DEFLATED, compresslevel=6, allowZip64=True) as bundle:
        for source, name in entries:
            bundle.write(source, name)
        bundle.writestr("ficha-imagenes.csv", "\ufeff" + table.getvalue())
    return {"model": model["id"], "path": str(destination), "bytes": destination.stat().st_size, "sha256": digest(destination), "images": len(rows), "originals": sum(bool(f["original"]) for f in files)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundles", action="store_true", help="Build private per-model ZIPs under output/")
    args = parser.parse_args()
    catalog, private = build_inventory()
    PUBLIC_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_MANIFEST.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PRIVATE_OUTPUT.mkdir(parents=True, exist_ok=True)
    (PRIVATE_OUTPUT / "source-map.json").write_text(json.dumps(private, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.bundles:
        generated = []
        for model in catalog["products"]:
            generated.append(write_bundle(model, private["models"][model["id"]], PRIVATE_OUTPUT / "bundles" / f"{model['id']}.zip"))
        (PRIVATE_OUTPUT / "bundle-manifest.json").write_text(json.dumps(generated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"counts": catalog["counts"], "bundles": args.bundles}, ensure_ascii=False))


if __name__ == "__main__":
    main()
