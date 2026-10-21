"""Create customer-facing descriptions for the verified Champion video previews."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "clientes/media-catalog.json").read_text(encoding="utf-8"))
MEDIA = json.loads((ROOT / "clientes/ghl-public-media.json").read_text(encoding="utf-8"))

# Descriptions are limited to scenes visible in the local video posters.
CATALOG_SCENES = [
    ("Champion en pantalla urbana", "Montura Champion presentada en una pantalla de la ciudad."),
    ("Presentación Champion", "Animación luminosa de la marca Champion."),
    ("Estilo en movimiento", "Persona con gafas Champion en una escena al aire libre."),
    ("Detalle de la montura", "Primer plano de la montura y el distintivo Champion."),
    ("Estilo casual", "Retrato de un hombre con montura óptica Champion."),
    ("Equipo Champion", "Grupo reunido en una escena urbana nocturna."),
    ("Champion en la ciudad", "Montura Champion presentada en una pantalla exterior."),
    ("Lentes de sol", "Acercamiento a una montura solar Champion."),
    ("Montura para cada día", "Hombre con montura Champion en un ambiente cotidiano."),
    ("Colección óptica", "Presentación de varias monturas ópticas Champion."),
    ("Deportes de invierno", "Deportista en la nieve con el paisaje de montaña de fondo."),
    ("Una mirada con actitud", "Mensaje de estilo de la campaña Champion."),
    ("Movimiento y estilo", "Persona con gafas Champion en una escena de patinaje."),
    ("Moda casual", "Look casual acompañado de gafas Champion."),
    ("Detalles Champion", "Primer plano de una montura Champion y sus acabados."),
    ("Fútbol de playa", "Deportista jugando con un balón en la playa."),
    ("Estilo deportivo", "Retrato de un hombre en una escena de campaña Champion."),
    ("Deporte en primer plano", "Balón de baloncesto en una pieza de la campaña deportiva."),
    ("Retrato Champion", "Hombre con gafas Champion y atuendo oscuro."),
    ("Voleibol de playa", "Deportistas en una escena de voleibol de playa."),
    ("Lentes solares Champion", "Primer plano de gafas de sol con lentes de color."),
    ("Vida activa", "Persona con gafas Champion en una escena deportiva."),
    ("Motociclismo", "Motocicleta de competición en una pieza Champion."),
    ("Jornada cotidiana", "Persona trabajando con gafas Champion."),
    ("Carrera al aire libre", "Deportista corriendo al aire libre."),
    ("Diseño deportivo", "Gafas Champion en una presentación de estilo deportivo."),
    ("Rendimiento al aire libre", "Deportista corriendo por un paisaje natural."),
    ("Protección y estilo", "Persona con gafas de sol Champion al aire libre."),
    ("Firma Champion", "Primer plano de la marca en la varilla de una montura."),
]

INSTAGRAM_SCENES = {
    "billboard": ("Montura en la ciudad", "Montura Champion presentada en una pantalla urbana."),
    "daily": ("Estilo de todos los días", "Hombre con montura Champion en un ambiente cotidiano."),
    "portrait": ("Retrato Champion", "Hombre con gafas Champion en una pieza de estilo casual."),
    "beach": ("Fútbol de playa", "Deportista jugando con un balón en la playa."),
    "team": ("Equipo Champion", "Grupo reunido en una escena urbana nocturna."),
    "volley": ("Voleibol de playa", "Deportista con gafas de sol en una cancha de playa."),
    "skate": ("Movimiento urbano", "Deportista en una escena de patinaje urbano."),
}

GROUPS = {
    "billboard": {1, 8, 24, 39, 40, 47, 53},
    "daily": {2, 4, 14, 18, 19, 23, 50, 51, 52},
    "portrait": {3, 13, 29, 30},
    "beach": {5, 7, 11, 15, 16, 17, 22, 25, 26, 27, 38, 43, 44, 49},
    "team": {6, 12, 28, 31, 45},
    "volley": {9, 10, 20, 21, 32, 33, 34, 35, 36, 37, 42, 46, 48, 54},
    "skate": {41},
}


def bilingual(title: str, description: str) -> dict:
    # Scene names are deliberately concise. English readers can still identify
    # the visual subject even when the source video has no verified translation.
    return {"title": {"es": title, "en": title}, "description": {"es": description, "en": description}, "language": "unknown"}


def main() -> None:
    result = {}
    videos = CATALOG["videos"]
    assert len(videos) == len(CATALOG_SCENES) == 29
    for video, (title, description) in zip(videos, CATALOG_SCENES):
        result[video["id"]] = bilingual(title, description)
    # Language is based on words visible in these specific previews only.
    for index in (10, 12, 13, 26):
        result[f"champion-video-{index:02d}"]["language"] = "es"
    result["champion-video-15"]["language"] = "en"

    instagram = sorted((item for item in MEDIA["instagram"] if item["type"] == "video"), key=lambda item: item["id"])
    assert len(instagram) == 54
    assert set(range(1, 55)) == set().union(*GROUPS.values())
    for index, video in enumerate(instagram, 1):
        group = next(name for name, positions in GROUPS.items() if index in positions)
        result[video["id"]] = bilingual(*INSTAGRAM_SCENES[group])
    (ROOT / "clientes/video-details.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
