"""Create web copies of the 48 CH17-CH19 Drive originals without altering them."""

from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[2]
SOURCE = PROJECT / "Catalogo Champion" / "CH17-CH19 Drive Originales"
TARGET = Path(__file__).resolve().parents[1] / "assets/images/optical"
VIEWS = (
    "01_diagonal_derecha.png",
    "02_frontal.png",
    "03_diagonal_izquierda.png",
    "04_lateral.png",
)


def save_webp(source: Path, target: Path, size: tuple[int, int], quality: int) -> None:
    with Image.open(source) as image:
        image.load()
        image.thumbnail(size, Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=quality, method=6)


def main() -> None:
    expected = {
        SOURCE / f"CH{model}" / f"C{variant}" / view
        for model in range(17, 20)
        for variant in range(1, 5)
        for view in VIEWS
    }
    actual = set(SOURCE.rglob("*.png"))
    if actual != expected:
        raise SystemExit(f"Source mismatch: missing={expected - actual}, unexpected={actual - expected}")

    for model in range(17, 20):
        for variant in range(1, 5):
            source_dir = SOURCE / f"CH{model}" / f"C{variant}"
            output = TARGET / f"ch{model}-c{variant}"
            output.mkdir(parents=True, exist_ok=True)
            for index, view in enumerate(VIEWS, 1):
                save_webp(source_dir / view, output / f"{index:02}.webp", (1500, 1150), 85)
            save_webp(source_dir / VIEWS[0], output / "cover-v3.webp", (1000, 760), 82)

    outputs = [
        file for model in range(17, 20) for variant in range(1, 5)
        for file in (TARGET / f"ch{model}-c{variant}").glob("*.webp")
    ]
    if len(outputs) != 60:
        raise SystemExit(f"Expected 60 WebP files, got {len(outputs)}")
    print("Prepared 48 gallery views and 12 covers from 48 untouched originals")


if __name__ == "__main__":
    main()
