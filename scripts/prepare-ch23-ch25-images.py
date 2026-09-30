"""Prepare web copies of the 36 verified CH23–CH25 Dropbox originals.

The source PNGs remain untouched in Catalogo Champion/CH23-CH25 Dropbox Originales.
Run from anywhere with a Python environment containing Pillow.
"""

from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[2]
SOURCE = PROJECT / "Catalogo Champion" / "CH23-CH25 Dropbox Originales"
TARGET = Path(__file__).resolve().parents[1] / "assets/images/optical"
VIEWS = (
    ("DIAGONAL_DERECHA", "01.webp"),
    ("DIAGONAL_IZQUIERDA", "02.webp"),
    ("FRONTAL", "03.webp"),
)


def main() -> None:
    expected = {
        SOURCE / f"CH{model}" / f"CH{model}_C{color}_{view}.png"
        for model in range(23, 26)
        for color in range(1, 5)
        for view, _ in VIEWS
    }
    actual = set(SOURCE.rglob("*.png"))
    if actual != expected:
        raise SystemExit(
            f"Source mismatch: missing={sorted(expected - actual)}, "
            f"unexpected={sorted(actual - expected)}"
        )

    for model in range(23, 26):
        for color in range(1, 5):
            output = TARGET / f"ch{model}-c{color}"
            output.mkdir(parents=True, exist_ok=True)
            for view, filename in VIEWS:
                source = SOURCE / f"CH{model}" / f"CH{model}_C{color}_{view}.png"
                with Image.open(source) as image:
                    image.load()
                    image.thumbnail((1500, 1150), Image.Resampling.LANCZOS)
                    image.save(output / filename, "WEBP", quality=86, method=6)

    web_files = [
        file
        for model in range(23, 26)
        for color in range(1, 5)
        for file in (TARGET / f"ch{model}-c{color}").glob("*.webp")
    ]
    if len(web_files) != 36:
        raise SystemExit(f"Expected 36 WebP images; got {len(web_files)}")
    print(f"Prepared {len(web_files)} WebP images from 36 untouched PNG originals")


if __name__ == "__main__":
    main()
