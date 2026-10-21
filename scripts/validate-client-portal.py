"""Check the deliverable against the live-catalog data and private ZIP contents."""

from __future__ import annotations

import json
from pathlib import Path
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "output" / "client-portal"


def main() -> None:
    source = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))["products"]
    catalog = json.loads((ROOT / "clientes" / "media-catalog.json").read_text(encoding="utf-8"))
    bundles = json.loads((OUTPUT / "bundle-manifest.json").read_text(encoding="utf-8"))
    assert len(source) == len(catalog["products"]) == len(bundles) == 128
    assert {p["id"] for p in source} == {p["id"] for p in catalog["products"]}
    all_images = set()
    all_descriptions = 0
    total_originals = 0
    bundle_by_model = {entry["model"]: entry for entry in bundles}
    for product in catalog["products"]:
        source_product = next(p for p in source if p["id"] == product["id"])
        expected = set([source_product["cover"], *source_product["images"]])
        actual = {image["preview"].lstrip("/") for image in product["images"]}
        assert expected == actual, product["id"]
        all_images |= actual
        entry = bundle_by_model[product["id"]]
        with ZipFile(entry["path"]) as package:
            names = set(package.namelist())
            assert "ficha-imagenes.csv" in names
            assert len([name for name in names if name.startswith("web/")]) == len(expected)
            originals = sum(image["original"] is not None for image in product["images"])
            assert len([name for name in names if name.startswith("originales/")]) == originals
            total_originals += originals
        for image in product["images"]:
            assert (ROOT / image["preview"].lstrip("/")).is_file()
            assert product["sku"] in image["description"]["es"]
            assert product["sku"] in image["description"]["en"]
            all_descriptions += 1
    assert len(all_images) == all_descriptions == 580
    assert total_originals == catalog["counts"]["originalsMatched"] == 519
    assert len(catalog["videos"]) == catalog["counts"]["videos"] == 29
    assert all((ROOT / v["preview"].lstrip("/")).is_file() for v in catalog["videos"])
    drive_map_path = ROOT / "clientes" / "drive-map.json"
    if drive_map_path.exists():
        drive_map = json.loads(drive_map_path.read_text(encoding="utf-8"))
        assert set(drive_map["bundles"]) == {p["id"] for p in catalog["products"]}
        assert set(drive_map["videos"]) == {v["id"] for v in catalog["videos"]}
        file_ids = [*drive_map["bundles"].values(), *drive_map["videos"].values()]
        assert len(file_ids) == len(set(file_ids)) == 157
        assert all(isinstance(file_id, str) and file_id for file_id in file_ids)
    print(f"portal-validated: {len(source)} models, {all_descriptions} images, "
          f"{total_originals} original files, {len(catalog['videos'])} videos, {len(bundles)} ZIPs")


if __name__ == "__main__":
    main()
