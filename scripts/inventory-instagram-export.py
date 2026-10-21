"""Inventory Champion's official Instagram export ZIP parts without extracting them.

Usage: python scripts/inventory-instagram-export.py PATH_TO_ZIP [PATH_TO_ZIP ...]
The report stays under output/, which is excluded from the public repository.
"""
from __future__ import annotations

import json
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath


OUTPUT = Path(__file__).resolve().parents[1] / "output" / "client-portal" / "instagram-export-inventory.json"


def inspect_archive(path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(path)
    extensions: Counter[str] = Counter()
    folders: Counter[str] = Counter()
    entries: list[dict] = []
    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            name = PurePosixPath(info.filename)
            if name.is_absolute() or ".." in name.parts or "\\" in info.filename:
                raise ValueError(f"Unsafe path in {path.name}: {info.filename}")
            extension = name.suffix.lower() or "(none)"
            folder = "/".join(name.parts[:2]) if len(name.parts) > 1 else "(root)"
            extensions[extension] += 1
            folders[folder] += 1
            entries.append({"path": info.filename, "bytes": info.file_size, "crc32": f"{info.CRC:08x}"})
    return {
        "archive": path.name,
        "compressed_bytes": path.stat().st_size,
        "uncompressed_bytes": sum(item["bytes"] for item in entries),
        "files": len(entries),
        "extensions": dict(sorted(extensions.items())),
        "folders": dict(sorted(folders.items())),
        "entries": entries,
    }


def main(paths: list[str]) -> None:
    if not paths:
        raise SystemExit("Provide at least one export ZIP path")
    archives = [inspect_archive(Path(raw).resolve()) for raw in paths]
    owners: dict[str, list[str]] = defaultdict(list)
    for archive in archives:
        for entry in archive["entries"]:
            owners[entry["path"]].append(archive["archive"])
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "archives": archives,
        "unique_paths": len(owners),
        "path_collisions": {name: parts for name, parts in owners.items() if len(parts) > 1},
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    for archive in archives:
        print(f"{archive['archive']}: {archive['files']} files, {archive['uncompressed_bytes']} bytes, {archive['extensions']}")
    print(f"Unique paths: {report['unique_paths']}; collisions: {len(report['path_collisions'])}; report: {OUTPUT}")


if __name__ == "__main__":
    main(sys.argv[1:])
