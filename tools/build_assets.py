"""Prepara los recursos del juego web a partir del proyecto Unity.

Ejecutar desde Publicacion/juego:  python tools/build_assets.py
Copia y optimiza sprites, escenarios, música y voces en public/assets/.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from unity_atlas import convert  # noqa: E402

UNITY = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SPR = os.path.join(UNITY, 'Assets', 'Resources', 'Sprites')
AUD = os.path.join(UNITY, 'Assets', 'Resources', 'AudioClips')
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'assets'))


def out(*p):
    path = os.path.join(OUT, *p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def slices(png):
    """Rectángulos de un sprite Multiple de Unity (coordenadas de Phaser)."""
    meta = open(png + '.meta', encoding='utf-8').read()
    H = Image.open(png).size[1]
    rects = []
    for m in re.finditer(r'- serializedVersion: 2\s+name: (.+?)\s+rect:\s+serializedVersion: 2\s+x: ([\d.]+)\s+y: ([\d.]+)\s+width: ([\d.]+)\s+height: ([\d.]+)', meta):
        x, y, w, h = [int(float(v)) for v in m.groups()[1:]]
        rects.append((m.group(1).strip(), x, H - y - h, w, h))
    return rects


def strip(png, dest, frames=None):
    """Recorta los cuadros de una hoja de Unity y los pega en una tira horizontal de celdas iguales."""
    im = Image.open(png).convert('RGBA')
    rs = slices(png) or []
    if frames:
        rs = [r for r in rs if r[0] in frames] or rs
    rs.sort(key=lambda r: int(re.sub(r'\D', '', r[0].split('_')[-1]) or 0))
    cw = max(r[3] for r in rs); ch = max(r[4] for r in rs)
    sheet = Image.new('RGBA', (cw * len(rs), ch))
    for i, (_, x, y, w, h) in enumerate(rs):
        cell = im.crop((x, y, x + w, y + h))
        sheet.paste(cell, (i * cw + (cw - w) // 2, ch - h))  # alineado abajo-centro
    sheet.save(dest, optimize=True)
    return {'frameWidth': cw, 'frameHeight': ch, 'frames': len(rs)}


manifest = {'sprites': {}, 'audio': {}}

# ---------- Gravi ----------
C = os.path.join(SPR, 'Character')
for key, rel in {
    'gravi-idle': '1-Idle/animacion_idle-front.png',
    'gravi-idle-side': '1-Idle/animacion_idle_lateral.png',
    'gravi-walk': '2-Walk/animacion_caminar.png',
    'gravi-run': '3-Run/animacion_correr.png',
    'gravi-jump': '4-Jump/animacion_salto.png',
    'gravi-push': '6-Empujar/animacion_empujar.png',
}.items():
    src = os.path.join(C, rel)
    w, h = Image.open(src).size
    shutil.copy(src, out('sprites', key + '.png'))
    manifest['sprites'][key] = {'frameWidth': 64, 'frameHeight': 64, 'frames': w // 64}
manifest['sprites']['gravi-crouch'] = strip(os.path.join(C, '5-Agacharse/animacion_agacharse.png'), out('sprites', 'gravi-crouch.png'))
shutil.copy(os.path.join(C, 'Design/pixil-frame-0 (1).png'), out('sprites', 'gravi-portrait.png'))

# ---------- New (robot) y abuelo ----------
manifest['sprites']['new-idle'] = strip(os.path.join(SPR, 'Robot/Idle.png'), out('sprites', 'new-idle.png'))
shutil.copy(os.path.join(SPR, 'Abuelo/Isaac_Newton_pixelart.png'), out('sprites', 'abuelo.png'))
im = Image.open(os.path.join(SPR, 'AI-SORA/New-2.png')).convert('RGB'); W, H = im.size
im.crop((int(.04 * W), int(.33 * H), int(.29 * W), int(.70 * H))).resize((128, 284), Image.NEAREST).save(out('sprites', 'new-portrait.png'))

# ---------- Escenario: tiles 64 px de la megaestructura ----------
E = os.path.join(SPR, 'Environment', 'CyberPunk2')
shutil.copy(os.path.join(E, 'Second_Layer', '1. main platforms.png'), out('tiles', 'estructura.png'))
shutil.copy(os.path.join(E, 'Second_Layer', '2. second layer.png'), out('tiles', 'estructura-fondo.png'))
shutil.copy(os.path.join(E, 'Front_Layer', '0. front layer.png'), out('tiles', 'cables.png'))
convert(os.path.join(E, 'Front_Layer', '0. front layer.png'), out('tiles', 'cables.json'))
for i in range(1, 6):
    Image.open(os.path.join(E, 'Background', f'background{i}.png')).convert('RGB').save(out('bg', f'fondo{i}.jpg'), quality=82)

# Caja y plataforma (primer recorte de cada hoja)
for key, rel in {'caja': 'Interaction/box.png', 'plataforma': 'Interaction/platform.png'}.items():
    src = os.path.join(SPR, rel)
    rs = slices(src)
    _, x, y, w, h = rs[0]
    Image.open(src).convert('RGBA').crop((x, y, x + w, y + h)).save(out('sprites', key + '.png'), optimize=True)
    manifest['sprites'][key] = {'w': w, 'h': h}

# Íconos de conceptos
for key, rel, box in [('icono-tiempo', 'AI-SORA/Tiempo-2.png', (.10, .04, .48, .42)),
                      ('icono-distancia', 'AI-SORA/Distance.png', (.05, .05, .97, .21))]:
    im = Image.open(os.path.join(SPR, rel)).convert('RGB'); W, H = im.size
    c = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    c.thumbnail((256, 256)); c.save(out('sprites', key + '.png'))


# ---------- Audio (mismas pistas del juego Unity) ----------
def ffmpeg(src, dest, args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, *args, dest], check=True)


MUSICA = {
    'musica-niveles': 'HK-soundtrack/04 Forgotten Crossroads.mp3',
    'musica-final': 'HK-soundtrack/84 Birthplace (Full).mp3',
    'musica-prologo': 'Prologue/short_piano_for_opening_text.wav',
}
for key, rel in MUSICA.items():
    ffmpeg(os.path.join(AUD, rel), out('audio', key + '.mp3'), ['-ac', '2', '-b:a', '96k'])
    manifest['audio'][key] = f'audio/{key}.mp3'

for root, _, files in os.walk(os.path.join(AUD, 'Voices')):
    for f in files:
        if not f.lower().endswith('.mp3'):
            continue
        who = os.path.basename(os.path.dirname(root)).lower()  # Abuelo / Gravi / New / AulaEducativo
        key = 'voz-' + who + '-' + re.sub(r'[^a-z0-9]+', '-', f[:-4].lower()).strip('-')
        ffmpeg(os.path.join(root, f), out('audio', 'voces', key + '.mp3'), ['-ac', '1', '-b:a', '64k'])
        manifest['audio'][key] = f'audio/voces/{key}.mp3'

json.dump(manifest, open(out('manifest.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print(f"Recursos listos: {len(manifest['sprites'])} sprites, {len(manifest['audio'])} audios, {total / 1e6:.1f} MB")
