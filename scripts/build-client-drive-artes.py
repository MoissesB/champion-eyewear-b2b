"""Build the customer-facing Champion artwork catalog from verified GHL uploads."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / 'output/client-portal/drive-assets/artes'
MEDIA = 'https://assets.cdn.filesafe.space/itkQlAHHVlUS0uDAETp3/media/'
IDS = {
 'VOLCANO_7 LOGO.png':'6ad91a3d89ad2537e4a4b563','VOLCANO_6 LOGO.png':'6ad91a3b3be7ffaf0d53de9b',
 'VOLCANO_5 LOGO.png':'6ad91a3b55feecaeea928695','VOLLEY DE PLAYA 1.png':'6ad91a3f840bad1c1150713f',
 'VOLCANO_7.png':'6ad91a3e55feecaeea928725','VOLCANO_2_3_4 LOGO.png':'6ad91a39840bad1c11507088',
 'VOLCANO_6.png':'6ad91a3dac05a0d91fab94de','VOLCANO_5.png':'6ad91a3bfdcb71bb825c0a1b',
 'VOLCANO_4.png':'6ad91a3b55feecaeea928689','VOLCANO_3.png':'6ad91a3aa0c3fa1f7d5d5e05',
 'VOLCANO_1_3.png':'6ad91a3989ad2537e4a4b4eb','VOLCANO_2.png':'6ad91a396e47ee7c823ecce2',
 'TENIS_BALL LOGO.png':'6ad91a303be7ffaf0d53ddc7','VOLCANO_1_2.png':'6ad91a38a0bb969dd934f235',
 'VOLCANO_1_1.png':'6ad91a3855feecaeea928619','SNOW_1 LOGO.png':'6ad91a3055feecaeea92853d',
 'SNOW_2 LOGO.png':'6ad91a3089ad2537e4a4b3c7','VOLCANO_1.png':'6ad91a376e47ee7c823ecc7c',
 'PREMIATION_1 LOGO.png':'6ad91a2f89ad2537e4a4b39f','TENNIST.png':'6ad91a35fdcb71bb825c0950',
 'TENNIST LOGO.png':'6ad91a35a0c3fa1f7d5d5d48','MOTO_GP LOGO.png':'6ad91a2d6e47ee7c823ecb50',
 'TENIS_BALL.png':'6ad91a32a0bb969dd934f197','PREMIATION_1.png':'6ad91a2f89ad2537e4a4b3af',
 'F1_1 LOGO.png':'6ad91a2955feecaeea9284b3','DREAM_TEAM LOGO.png':'6ad91a2755feecaeea92849b',
 'MOTO_GP.png':'6ad91a2eb87a281ad1a42fcb','ESCALADOR_1 LOGO.png':'6ad91a28a0bb969dd934f067',
 'LOGO SUN NARANJA 1.png':'6ad91a2dac05a0d91fab929c','LOGO SUN AZUL.png':'6ad91a2cb87a281ad1a42f89',
 'CHILENA_1 LOGO.png':'6ad91a266e47ee7c823eca9c','F1_1.png':'6ad91a2ab87a281ad1a42f55',
 'ESCALADOR_1.png':'6ad91a29b87a281ad1a42f25','DREAM_TEAM.png':'6ad91a28fdcb71bb825c07bb',
 'ATHLETE_1 LOGO.png':'6ad91a1ca0c3fa1f7d5d5a5d','CHILENA_1.png':'6ad91a26fdcb71bb825c0792',
 '2.png':'6ad91a1bb87a281ad1a42d3e','ChatGPT Image 6 jun 2026, 09_17_44 (3).png':'6ad91a2589ad2537e4a4b297',
 'ChatGPT Image 6 jun 2026, 09_17_43 (2).png':'6ad91a25a0c3fa1f7d5d5b70',
 '180_SWIM LOGO.png':'6ad91a15a0c3fa1f7d5d59a4','ChatGPT Image 6 jun 2026, 09_17_43 (1).png':'6ad91a22840bad1c11506e2c',
 'ChatGPT Image 5 jun 2026, 14_54_12.png':'6ad91a22ac05a0d91fab9196','100_MTS LOGO.png':'6ad91a15a0bb969dd934ee4f',
 '180_GYM LOGO.png':'6ad91a1555feecaeea9281bb','ATHLETE_1.png':'6ad91a1efdcb71bb825c06b4',
 '180_SWIM.png':'6ad91a1a6e47ee7c823ec974','180.png':'6ad91a15840bad1c11506c66',
 '100_MTS.png':'6ad91a15840bad1c11506c59','180_GYM.png':'6ad91a15840bad1c11506c53',
}
SCENES = {
 'VOLCANO':'Aventura al aire libre','VOLLEY':'Voleibol de playa','TENIS':'Tenis','TENNIST':'Tenis',
 'SNOW':'Deportes de invierno','PREMIATION':'Premiación deportiva','MOTO':'Motociclismo',
 'F1':'Automovilismo','DREAM':'Equipo deportivo','ESCALADOR':'Escalada',
 'CHILENA':'Fútbol','ATHLETE':'Atletismo','100_MTS':'Atletismo',
 '180_SWIM':'Natación','180_GYM':'Gimnasia','180':'Deporte en acción',
 'LOGO SUN':'Gafas de sol','ChatGPT':'Deportes de invierno','2.png':'Deportes de invierno',
}
ENGLISH = {'Aventura al aire libre':'Outdoor adventure','Voleibol de playa':'Beach volleyball','Tenis':'Tennis',
 'Deportes de invierno':'Winter sports','Premiación deportiva':'Sports awards','Motociclismo':'Motorcycling',
 'Automovilismo':'Motorsports','Equipo deportivo':'Team sports','Escalada':'Climbing','Fútbol':'Football',
 'Atletismo':'Athletics','Natación':'Swimming','Gimnasia':'Gymnastics','Deporte en acción':'Sports in action',
 'Gafas de sol':'Sunglasses'}

def scene(name):
    return next((label for prefix,label in SCENES.items() if name.startswith(prefix)), 'Estilo deportivo')

items=[]
for filename,media_id in IDS.items():
    assert (LOCAL / filename).is_file(), filename
    with Image.open(LOCAL / filename) as image:
        width,height=image.size
    label=scene(filename)
    logo=' LOGO' in filename or filename.startswith('LOGO SUN')
    number=sum(1 for old in items if old['scene']==label)+1
    en=ENGLISH.get(label,'Sport style')
    title_es=f'{label} · pieza {number}'
    title_en=f'{en} · artwork {number}'
    fmt='story' if height>width*1.3 else 'pendon' if width>height*1.5 else 'post'
    category='casual' if label=='Gafas de sol' else 'deportivo'
    items.append({'id':f'drive-art-{media_id}','name':filename,'title':{'es':title_es,'en':title_en},
        'description':{'es':f'Imagen Champion de {label.lower()}'+(' con logo de la marca.' if logo else '.'),
                       'en':f'Champion {en.lower()} image'+(' with brand logo.' if logo else '.')},
        'scene':label,'category':category,'format':fmt,'width':width,'height':height,
        'preview':MEDIA+media_id+'.png','url':MEDIA+media_id+'.png'})
assert len(items)==49
destination=ROOT/'clientes/drive-artes.json'
sequence=['VOLCANO_1.png','VOLCANO_1_1.png','VOLCANO_1_2.png','VOLCANO_1_3.png',
          'VOLCANO_2.png','VOLCANO_3.png','VOLCANO_4.png']
slides=[next(item for item in items if item['name']==name) for name in sequence]
carousels=[{'id':'drive-carousel-volcano','title':{'es':'Aventura al aire libre · carrusel',
    'en':'Outdoor adventure · carousel'},'description':{'es':'Siete imágenes de una misma campaña para publicar en secuencia.',
    'en':'Seven images from one campaign, ready to publish in sequence.'},'slides':slides,
    'preview':slides[0]['url']}]
destination.write_text(json.dumps({'items':items,'carousels':carousels},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(destination, len(items))
