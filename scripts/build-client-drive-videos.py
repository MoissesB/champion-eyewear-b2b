"""Build visual previews and metadata for videos uploaded from Champion Drive."""
import json
from pathlib import Path

import av
from PIL import Image, ImageDraw, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'output/client-portal/drive-assets/videos'
POSTERS=ROOT/'assets/client-video-posters'
MEDIA='https://assets.cdn.filesafe.space/itkQlAHHVlUS0uDAETp3/media/'
IDS={
 'Video sin título.mp4':'6ad91b0f89ad2537e4a4d851','video 9.mp4':'6ad91b0ffdcb71bb825c2671',
 'Video 6 (2).mp4':'6ad91b0cac05a0d91fabafe2','video 8.mp4':'6ad91b0da0c3fa1f7d5d8572',
 'video 6.mp4':'6ad91b0c840bad1c11508e22','Copia de Copia de Copia de INNOVA Video 1 (3).mp4':'6ad91afd6e47ee7c823ef86d',
 'video 2.mp4':'6ad91b0ba0c3fa1f7d5d8533','video 3.mp4':'6ad91b0ba0bb969dd9351534',
 'SOL VOLLEY.mp4':'6ad91b0aac05a0d91fabaf92','video 1.mp4':'6ad91b0aa0bb969dd93514f9',
 'video 10.mp4':'6ad91b0a840bad1c11508de6','MUNDIAL.mp4':'6ad91b05a0c3fa1f7d5d84a8',
 'SOL FUTBOL CARIOCA.mp4':'6ad91b0889ad2537e4a4d759','MOTOGROK 2.mp4':'6ad91b03a0c3fa1f7d5d8460',
 'MUNDIAL2.mp4':'6ad91b0755feecaeea92ac44','SOL CARIOCA 2.mp4':'6ad91b07840bad1c11508d92',
 'MOTOGROK 3.mp4':'6ad91b04ac05a0d91fabaecc','grok-video-97a4f16a-8ae8-46fc-a273-9647bb87b442.mp4':'6ad91b016e47ee7c823ef94d',
 'MOTO GP.mp4':'6ad91b02ac05a0d91fabae87','CHAMPION DERRETIDO.mp4':'6ad91afc6e47ee7c823ef839',
 'CHAMPION VUELA.mp4':'6ad91afd840bad1c11508bec','grok-video-72b6c1c5-7746-43e2-be8f-29d328189253.mp4':'6ad91b01ac05a0d91fabae1f',
 'CHAMPION SURFEA.mp4':'6ad91afc840bad1c11508bc4','CHAMPION NAUFRAGA.mp4':'6ad91afc55feecaeea92aab2',
 'grok-video-69ab9377-3814-49a9-9920-e07fbcbc37ae.mp4':'6ad91afd840bad1c11508c0f',
 '6.mp4':'6ad91afba0bb969dd9351296','8.mp4':'6ad91afbac05a0d91fabad61',
 '9.mp4':'6ad91afbfdcb71bb825c249f','13.mp4':'6ad91af9a0c3fa1f7d5d8331',
 '12.mp4':'6ad91afa6e47ee7c823ef7ed','2.mp4':'6ad91af9a0c3fa1f7d5d833b',
 '10.mp4':'6ad91afa6e47ee7c823ef7dd','18.mp4':'6ad91afa6e47ee7c823ef7de',
 '11.mp4':'6ad91af9a0bb969dd9351252','SUNSNOWORANGE.mp4':'6ad91c0155feecaeea92caef',
}
SCENES=[
 ('Motociclismo Champion','Motocicleta de competición con identidad Champion.','Champion motorcycling','Racing motorcycle with Champion branding.'),
 ('Atletismo Champion','Corredores en pista junto a una montura Champion.','Champion athletics','Track runners alongside a Champion frame.'),
 ('Estilo al aire libre','Deportista con montura Champion en una escena de aventura.','Outdoor style','Athlete wearing Champion eyewear in an adventure scene.'),
 ('Deportes acuáticos','Deportista sobre una tabla en el agua.','Water sports','Athlete riding a board on the water.'),
 ('Aventura Champion','Primer plano de un deportista con gafas Champion.','Champion adventure','Close-up of an athlete wearing Champion eyewear.'),
 ('Lentes solares deportivas','Presentación de gafas de sol Champion con lentes de color.','Sport sunglasses','Champion sunglasses with colorful lenses.'),
 ('Gafas bajo la lluvia','Una montura aparece sobre una superficie de agua con lluvia.','Eyewear in the rain','A frame appears on a rain-covered water surface.'),
 ('Una mirada que destaca','Una montura emerge entre gotas y reflejos de agua.','A standout look','A frame emerges among water droplets and reflections.'),
 ('Voleibol de playa','Jugador en una escena de voleibol de playa.','Beach volleyball','Player in a beach volleyball scene.'),
 ('Lentes en el agua','Gafas Champion presentadas entre salpicaduras de agua.','Eyewear in water','Champion eyewear shown amid water splashes.'),
 ('Montura y estuche Champion','Montura óptica junto a su estuche Champion.','Champion frame and case','Optical frame shown with a Champion case.'),
 ('Pasión por el fútbol','Trofeo de fútbol ante una multitud en el estadio.','Football passion','Football trophy in front of a stadium crowd.'),
 ('Fútbol de playa','Deportista con gafas de sol jugando con un balón en la playa.','Beach football','Athlete wearing sunglasses and playing football on the beach.'),
 ('Motociclismo en pista','Motocicleta Champion en una escena de circuito.','Racing on track','Champion motorcycle on a racing circuit.'),
 ('Celebración deportiva','Aficionados celebran en un estadio de fútbol.','Sports celebration','Fans celebrating in a football stadium.'),
 ('Fútbol junto al mar','Deportista con gafas Champion domina el balón en la playa.','Football by the sea','Athlete wearing Champion eyewear controls a ball on the beach.'),
 ('Velocidad Champion','Motocicleta de competición con detalles de la marca.','Champion speed','Racing motorcycle with Champion details.'),
 ('Champion en el aire','Parapente Champion sobre un paisaje de montaña y lago.','Champion in flight','Champion paraglider above mountains and a lake.'),
 ('Campeonato de motociclismo','Motocicleta Champion en pista con público al fondo.','Motorcycling championship','Champion motorcycle on track with spectators in the background.'),
 ('Detalles de la montura','Montura óptica Champion vista desde un costado.','Frame details','Side view of a Champion optical frame.'),
 ('Montura entre reflejos','Montura Champion presentada junto a reflejos de agua.','Frame and reflections','Champion frame shown beside water reflections.'),
 ('Victoria deportiva','Deportista celebra ante el público en un estadio.','Sporting victory','Athlete celebrating before a stadium crowd.'),
 ('Diseño de montura','Montura Champion presentada desde varios ángulos.','Frame design','Champion frame presented from different angles.'),
 ('Perfil de la montura','Primer plano de una montura Champion plateada.','Frame profile','Close-up of a silver Champion frame.'),
 ('Atletismo y estilo','Montura Champion superpuesta a una carrera en pista.','Athletics and style','Champion frame overlaid on a track race.'),
 ('Estilo Champion','Retrato de un hombre con montura Champion.','Champion style','Portrait of a man wearing Champion eyewear.'),
 ('Detalle de la varilla','Acercamiento al logo Champion en la varilla de una montura.','Temple detail','Close-up of the Champion logo on a frame temple.'),
 ('Montura negra y roja','Detalle frontal de una montura Champion negra y roja.','Black and red frame','Front detail of a black and red Champion frame.'),
 ('Diseño óptico Champion','Presentación de una montura óptica negra y roja.','Champion optical design','Presentation of a black and red optical frame.'),
 ('Reconocimiento deportivo','Retrato de un deportista junto a un trofeo.','Sporting recognition','Portrait of an athlete beside a trophy.'),
 ('Deporte cotidiano','Hombre con gafas Champion en una escena deportiva.','Everyday sport','Man wearing Champion eyewear in a sports setting.'),
 ('Detalle de montura dorada','Acercamiento a una montura Champion de tono dorado.','Gold frame detail','Close-up of a gold-tone Champion frame.'),
 ('Montura óptica Champion','Montura Champion presentada sobre fondo claro.','Champion optical frame','Champion frame presented on a light background.'),
 ('Colección óptica','Montura Champion junto a un estuche de la marca.','Optical collection','Champion frame shown with a branded case.'),
 ('Sol y nieve','Deportista descendiendo sobre nieve bajo el sol de montaña.','Sun and snow','Athlete descending a snowy slope under the mountain sun.'),
]
assert len(SCENES)==len(IDS)

# Clasificación confirmada por el propietario en la galería, vistas 71 a 74.
USER_NO_LANGUAGE = {
    32: 'Detalle de montura dorada',
    33: 'Montura óptica Champion',
    34: 'Colección óptica',
    35: 'Sol y nieve',
}

def frame_and_size(path):
    with av.open(str(path)) as container:
        stream=container.streams.video[0]
        width,height=stream.width,stream.height
        candidates=[]
        for frame in container.decode(stream):
            if frame.time is None or frame.time < .7:
                continue
            candidates.append(frame.to_image().convert('RGB'))
            if frame.time>=2.5 or len(candidates)>=12:
                break
        if not candidates:
            raise ValueError(f'No decodable frames: {path.name}')
        picture=candidates[-1]
        picture.thumbnail((480,480),Image.Resampling.LANCZOS)
        return picture,width,height

items=[]
sheet=Image.new('RGB',(1000,((len(IDS)+4)//5)*190),'white')
draw=ImageDraw.Draw(sheet)
for index,(name,media_id) in enumerate(IDS.items()):
    source=SOURCE/name
    assert source.is_file() and source.stat().st_size>0,name
    picture,width,height=frame_and_size(source)
    resource_id=f'drive-video-{index+1:02}'
    POSTERS.mkdir(parents=True,exist_ok=True)
    picture.save(POSTERS/f'{resource_id}.jpg',quality=82,optimize=True)
    thumb=ImageOps.contain(picture,(180,150))
    x=(index%5)*200+(180-thumb.width)//2
    y=(index//5)*190
    sheet.paste(thumb,(x,y))
    draw.text(((index%5)*200+5,y+153),f'{index+1}. {name[:20]}',fill='black')
    items.append({'id':resource_id,'name':name,'url':MEDIA+media_id+'.mp4','width':width,'height':height})
assert len(items)==35
sheet.save(ROOT/'output/client-portal/drive-videos-contact.jpg',quality=85)
for item,(es,es_description,en,en_description) in zip(items,SCENES):
    item['title']={'es':es,'en':en}
    item['description']={'es':es_description,'en':en_description}
    item['language']='unknown'
for index, title in USER_NO_LANGUAGE.items():
    assert items[index-1]['title']['es']==title
    items[index-1]['language']='unknown'
(ROOT/'clientes/drive-videos.json').write_text(json.dumps({'items':items},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(items))
