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

# Confirmed by speech recognition with audible words and >= 0.80 confidence.
# Music-only or silent clips remain unclassified.
SPOKEN_ES = set("""champion-video-14 champion-video-16 champion-video-20 champion-video-24 champion-video-27 champion-video-28 post-17880058548496463 post-17901658173494547 post-17982979257058079 post-18010661402940194 post-18022106066898343 post-18055841018525459 post-18083418266446797 post-18102217640332636 post-18104443418126927 post-18108490075832026""".split())
SPOKEN_EN = set("""champion-video-21 post-17954562582207684 post-17960965821077802 post-18012198815946361 post-18055677191530441 post-18061161968746834 post-18082524830305641 post-18086701883392673 post-18097514126573171 post-18097803692344940 post-18098608889260746 post-18108613556019174 post-18119833453801059 post-18128891818661381 post-18130395031648151 post-18160286722483880 post-18171065368446345 post-18183670882393720 post-18617529268031124""".split())

# Clasificación corregida por el propietario en la galería, vistas 1 a 30.
USER_ES = {5, 10, 11, 12, 13, 14, 15, 16, 18, 20, 21, 22, 24, 26, 27, 28}
USER_NO_LANGUAGE = {1, 2, 3, 4, 6, 7, 8, 9, 17, 19, 23, 25, 29}
USER_NO_LANGUAGE_POSTS = {"post-17852084106676798"}  # Vista 30: Montura en la ciudad.
assert USER_ES.isdisjoint(USER_NO_LANGUAGE)
assert USER_ES | USER_NO_LANGUAGE == set(range(1, 30))


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
    for video_id in SPOKEN_ES:
        result[video_id]["language"] = "es"
    for video_id in SPOKEN_EN:
        result[video_id]["language"] = "en"
    for index in USER_ES:
        result[f"champion-video-{index:02d}"]["language"] = "es"
    for index in USER_NO_LANGUAGE:
        result[f"champion-video-{index:02d}"]["language"] = "unknown"
    for video_id in USER_NO_LANGUAGE_POSTS:
        result[video_id]["language"] = "unknown"
    (ROOT / "clientes/video-details.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
