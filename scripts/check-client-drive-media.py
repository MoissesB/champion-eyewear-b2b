"""Check that every Champion Drive asset has a working public GHL URL."""
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]/'clientes'
artes=json.loads((ROOT/'drive-artes.json').read_text(encoding='utf-8'))['items']
videos=json.loads((ROOT/'drive-videos.json').read_text(encoding='utf-8'))['items']
logos=json.loads((ROOT/'drive-logos.json').read_text(encoding='utf-8'))
assets=[*artes,*videos,*logos]

def check(asset):
    try:
        with urlopen(Request(asset['url'],method='HEAD',headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as response:
            content_type=response.headers.get('Content-Type','')
            if response.status!=200 or not content_type.startswith(('image/','video/')):
                return asset['id'],response.status,content_type
    except Exception as error:
        return asset['id'],str(error)
    return None

with ThreadPoolExecutor(max_workers=8) as pool:
    failures=[result for result in pool.map(check,assets) if result]
print(f'checked={len(assets)} failed={len(failures)}')
for failure in failures:
    print(failure)
if failures:
    raise SystemExit(1)
