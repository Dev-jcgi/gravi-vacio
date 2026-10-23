"""Exporta las escenas del juego Unity al formato del juego web.

Ejecutar desde Publicacion/juego:  python tools/exportar_unity.py
Lee el proyecto Unity (sin modificarlo) y escribe en public/assets/unity/:
  - escenas/<nombre>.json : sprites, sólidos, zonas y objetos en coordenadas de Phaser
  - tex/<clave>.png + .json : atlas de cada textura usada (recortes de los .meta de Unity)
Escala: 1 unidad de Unity = 100 px (el PPU de los tilesets), con el eje Y invertido.
"""
import json
import math
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import unity_scene as U  # noqa: E402

PPU = 100
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'unity'))
SCENES = U.ASSETS + '/Scenes/'

ESCENAS = {
    'tutorial': '3-Tutorial/Tutorial_Level.unity',
    'tiempo': '4-Levels/1-Time/Time_Level 1.unity',
    'distancia': '4-Levels/2-Distance/Distance_Level.unity',
    'velocidad': '4-Levels/3-Speed/Speed_Level.unity',
    'prefinal': '5-End/PreFinal.unity',
    'final': '5-End/Final_Level.unity',
    'aula': '5-End/AulaEducativo.unity',
    'menu': '2-Menu/MainMenu.unity',
}

# Objetos que el juego web anima o controla: sus sprites se exportan agrupados
DINAMICOS = re.compile(r'^(Player|Gravi|Box.*|boton|Plataforma.*|plataforma.*|Portal.*|Robot|New-2_0|Back|Logo|'
                       r'platform_0|speed_\d|Tiempo-2_0|Distance_0|Interfaz|Flecha|10( \(\d+\))?|Front|Midle-1|Midle-2|'
                       r'Background|Background_End|Environment|Back|aulaeducativa|TimeLevel|DistanceLevel|SpeedLevel|Rules|ejemplo\w+|'
                       r'5segundos|Fisica|Paso|adios|interfaz.*)$')
# Grupos que solo agrupan escenario estático aunque su nombre coincida
ESTATICOS = {'tutorial': {'Front', 'Midle-1', 'Midle-2', 'Environment', 'Background', 'Back'},
             'tiempo': {'Front', 'Midle-1', 'Midle-2', 'Environment', 'Background', 'Back'},
             'distancia': {'Front', 'Midle-1', 'Midle-2', 'Environment', 'Background', 'Back'},
             'velocidad': {'Front', 'Midle-1', 'Midle-2', 'Environment', 'Background', 'Back'},
             'menu': {'Background'},
             'prefinal': {'Environment', 'Front'},
             'final': {'Environment', 'Front', 'Interfaz'},
             'aula': {'Environment', 'Front', 'Interfaz'}}
# Objetos de la interfaz o efectos que no se dibujan en el mundo
OMITIR = re.compile(r'(Start Blanker|Blanker|buttoncrt|Cloud_Particles|VFX|^sombra$)')

texturas = {}


def clave(tex):
    rel = os.path.relpath(tex, U.ASSETS).replace('\\', '/')
    rel = re.sub(r'^(Resources/Sprites/|Scenes/)', '', rel)
    k = re.sub(r'[^a-z0-9]+', '-', rel.lower().rsplit('.', 1)[0]).strip('-')
    return k[-48:].strip('-')


def registrar(si, escala=1.0):
    k = clave(si['tex'])
    t = texturas.setdefault(k, {'tex': si['tex'], 'frames': {}})
    fname = str(si.get('name') or 'f')
    fr = t['frames'].setdefault(fname, {'x': int(si['x']), 'y': int(si['y']), 'w': int(si['w']), 'h': int(si['h']), 'max': 0})
    fr['max'] = max(fr['max'], abs(escala))
    return k, fname


def descomponer(m):
    """Matriz 2x2 de Unity (Y arriba) -> rotación y escala de Phaser (Y abajo)."""
    a, b, c, d = m[0], -m[1], -m[2], m[3]
    sx = math.hypot(a, c)
    if sx < 1e-9:
        return 0.0, 0.0, 0.0
    rot = math.atan2(c, a)
    sy = (a * d - b * c) / sx
    return rot, sx, sy


def px(x, y):
    return round(x * PPU, 2), round(-y * PPU, 2)


def grupo_de(o, por_id, nombre):
    """Primer antepasado (desde la raíz) cuyo nombre lo marca como objeto dinámico."""
    for gid in o['ids']:
        g = por_id.get(gid)
        if not g:
            continue
        n = g['name']
        if n in ESTATICOS.get(nombre, set()):
            continue
        if DINAMICOS.match(n):
            return g
    return None


def aabb(c):
    a, b, cc, d, tx, ty = c['m']
    o = c.get('offset') or {'x': 0, 'y': 0}
    s = c.get('size') or {'x': 0, 'y': 0}
    if c['cls'] == 70 or c['cls'] == 61:
        hw, hh = s['x'] / 2, s['y'] / 2
    elif c['cls'] == 58:
        hw = hh = float(c.get('radius') or .5)
    else:
        return None
    xs, ys = [], []
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        lx, ly = o['x'] + sx * hw, o['y'] + sy * hh
        xs.append(a * lx + b * ly + tx)
        ys.append(cc * lx + d * ly + ty)
    x0, y1 = px(min(xs), min(ys))
    x1, y0 = px(max(xs), max(ys))
    return [x0, y0, round(x1 - x0, 2), round(y1 - y0, 2)]


def limpiar(v):
    if isinstance(v, dict):
        if set(v) <= {'fileID', 'guid', 'type'}:
            if v.get('guid'):
                p = U.guidmap().get(v['guid'])
                return os.path.basename(p) if p else None
            return str(v.get('fileID'))
        return {k: limpiar(x) for k, x in v.items()}
    if isinstance(v, list):
        return [limpiar(x) for x in v]
    return U.conv(v)


def exportar(nombre, ruta):
    d = U.scene(SCENES + ruta)
    por_id = {o['id']: o for o in d['objects']}

    # Lista de sprites del mundo (incluye mosaicos de tilemaps), ordenada como en Unity
    items = []
    for s in d['sprites']:
        si = s['sprite']
        if s['ui'] or not si or not si.get('tex') or 'w' not in si or not s['enabled'] or OMITIR.search(s['path']):
            continue
        items.append((s['layerID'], s['order'], -s['z'], s, si))
    for t in d['tiles']:
        if not t['active']:
            continue
        cw, ch = t['cell']['x'], t['cell']['y']
        ax, ay = t['anchor']['x'], t['anchor']['y']
        a, b, c, dd, tx, ty = t['m']
        for e in t['tiles']:
            si = t['sprites'][e['s']] if e['s'] < len(t['sprites']) else None
            if not si or 'w' not in si or not si.get('tex'):
                continue
            lx, ly = (e['x'] + ax) * cw, (e['y'] + ay) * ch
            s = {**t, 'm': [a, b, c, dd, a * lx + b * ly + tx, c * lx + dd * ly + ty], 'color': [1, 1, 1, 1], 'flipX': 0, 'flipY': 0}
            items.append((t['layerID'], t['order'], -t['z'], s, si))
    items.sort(key=lambda i: (i[0], i[1], i[2]))

    estaticos, grupos = [], {}
    for depth, (_, order, _, s, si) in enumerate(items):
        m = list(s['m'])
        if s.get('flipX'):
            m[0], m[2] = -m[0], -m[2]
        if s.get('flipY'):
            m[1], m[3] = -m[1], -m[3]
        rot, sx, sy = descomponer(m)
        if sx == 0 or sy == 0:
            continue
        g = grupo_de(s, por_id, nombre) if 'ids' in s else None
        if not g and not s['active']:
            continue
        k, f = registrar(si, max(abs(sx), abs(sy)) * 100 / si['ppu'])
        x, y = px(m[4], m[5])
        col = s['color']
        tint = (int(col[0] * 255) << 16) | (int(col[1] * 255) << 8) | int(col[2] * 255)
        ppx = PPU / si['ppu']
        spr = [k, f, x, y, round(rot, 4), round(sx * ppx, 4), round(sy * ppx, 4), round(si['px'], 4), round(1 - si['py'], 4),
               tint, round(col[3], 3), depth, order]
        if g:
            gx, gy = px(g['m'][4], g['m'][5])
            gr = grupos.setdefault(g['id'], {'nombre': g['name'], 'ruta': g['path'], 'x': gx, 'y': gy, 'activo': g['active'],
                                              'propio': g.get('selfActive', True), 'sprites': []})
            spr[2], spr[3] = round(x - gx, 2), round(y - gy, 2)
            gr['sprites'].append(spr + [s['active']])
        else:
            estaticos.append(spr)

    solidos, zonas = [], []
    for c in d['colliders']:
        if not c['enabled'] or c.get('composite'):
            continue
        r = aabb(c)
        if not r or r[2] <= 0 or r[3] <= 0:
            continue
        g = grupo_de(c, por_id, nombre)
        e = {'nombre': c['name'], 'ruta': c['path'], 'r': r, 'activo': c['active']}
        if g:
            e['grupo'] = str(g['id'])
        (zonas if c['trigger'] else solidos).append(e)

    scripts = {}
    for s in d['scripts']:
        scripts.setdefault(s['id'], []).append({'script': s['script'], 'activo': s['enabled'], 'campos': limpiar(s['fields'])})

    # Objetos a los que apuntan campos de scripts (destinos de teletransporte, puntos de reaparición…)
    referidos = set()
    for lista in scripts.values():
        for sc in lista:
            pila = [sc['campos']]
            while pila:
                v = pila.pop()
                if isinstance(v, dict):
                    pila.extend(v.values())
                elif isinstance(v, list):
                    pila.extend(v)
                elif isinstance(v, str) and v.isdigit():
                    referidos.add(v)

    objetos = []
    for o in d['objects']:
        x, y = px(o['m'][4], o['m'][5])
        e = {'id': str(o['id']), 'tid': str(o.get('tid')), 'nombre': o['name'], 'ruta': o['path'], 'x': x, 'y': y, 'activo': o['active'], 'propio': o.get('selfActive', True)}
        rot, sx, sy = descomponer(o['m'])
        if abs(sx - 1) > 1e-3 or abs(sy - 1) > 1e-3 or abs(rot) > 1e-3:
            e['rot'], e['sx'], e['sy'] = round(rot, 4), round(sx, 4), round(sy, 4)
        for k in ('camera', 'audio', 'text', 'animator', 'rb'):
            if o.get(k):
                e[k] = o[k] if k != 'animator' else os.path.basename(o[k])
        if o['id'] in scripts:
            e['scripts'] = scripts[o['id']]
        if o['ui'] and not (e.get('text') or e.get('scripts')):
            continue
        if len(e) > 7 or o['id'] in grupos or o['name'] in ('Player',) or str(o['id']) in referidos or str(o.get('tid')) in referidos:
            objetos.append(e)

    xs = [s[2] for s in estaticos]
    ys = [s[3] for s in estaticos]
    data = {'nombre': nombre, 'ppu': PPU, 'limites': [min(xs, default=0), min(ys, default=0), max(xs, default=0), max(ys, default=0)],
            'texturas': sorted({s[0] for s in estaticos} | {s[0] for g in grupos.values() for s in g['sprites']}),
            'sprites': estaticos, 'grupos': {str(k): v for k, v in grupos.items()}, 'solidos': solidos, 'zonas': zonas, 'objetos': objetos}
    os.makedirs(os.path.join(OUT, 'escenas'), exist_ok=True)
    with open(os.path.join(OUT, 'escenas', nombre + '.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{nombre}: {len(estaticos)} sprites, {len(grupos)} grupos, {len(solidos)} sólidos, {len(zonas)} zonas, {len(data["texturas"])} texturas')


ZOOM_MAX = 1.35  # zoom máximo de cámara usado en el juego web


def guardar_texturas():
    """Guarda cada textura como atlas con solo los recortes usados.

    Los recortes que en pantalla se ven mucho más pequeños que su resolución original se
    reducen; su factor queda en meta.escalas para que el juego compense la escala."""
    import hashlib
    os.makedirs(os.path.join(OUT, 'tex'), exist_ok=True)
    for f in os.listdir(os.path.join(OUT, 'tex')):
        os.remove(os.path.join(OUT, 'tex', f))
    vistos = {}
    alias = {}
    for k, t in sorted(texturas.items()):
        im = Image.open(t['tex']).convert('RGBA')
        W, H = im.size
        recortes = []
        for n, r in t['frames'].items():
            esc = min(1.0, r['max'] * ZOOM_MAX) if r['max'] > 0 else 1.0
            esc = 1.0 if esc > 0.6 else max(esc, 0.05)
            c = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
            if esc < 1.0:
                c = c.resize((max(1, round(r['w'] * esc)), max(1, round(r['h'] * esc))), Image.LANCZOS)
            recortes.append((n, c, r['w'] / c.size[0]))
        area = sum(c.size[0] * c.size[1] for _, c, _ in recortes)
        frames, escalas = {}, {}
        if area > 0.6 * W * H and all(e == 1 for _, _, e in recortes) and max(W, H) <= 2048:
            hoja = im
            for n, r in t['frames'].items():
                frames[n] = {'x': r['x'], 'y': r['y'], 'w': r['w'], 'h': r['h']}
        else:
            # empaquetado por estantes con 2 px de separación
            recortes.sort(key=lambda r: -r[1].size[1])
            ancho = max(1024, max(c.size[0] for _, c, _ in recortes) + 4)
            x = y = fila = 0
            pos = []
            for n, c, e in recortes:
                w, h = c.size
                if x + w + 2 > ancho:
                    x, y, fila = 0, y + fila + 2, 0
                pos.append((n, c, e, x, y))
                x += w + 2
                fila = max(fila, h)
            alto = y + fila
            ancho = max(x0 + c.size[0] for _, c, _, x0, _ in pos)
            hoja = Image.new('RGBA', (ancho, alto))
            for n, c, e, x0, y0 in pos:
                hoja.paste(c, (x0, y0))
                frames[n] = {'x': x0, 'y': y0, 'w': c.size[0], 'h': c.size[1]}
                if e != 1:
                    escalas[n] = round(e, 4)
        h = hashlib.md5(hoja.tobytes() + json.dumps(frames, sort_keys=True).encode()).hexdigest()
        if h in vistos:
            alias[k] = vistos[h]
            continue
        vistos[h] = k
        jf = {n: {'frame': fr, 'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': fr['w'], 'h': fr['h']},
                  'sourceSize': {'w': fr['w'], 'h': fr['h']}} for n, fr in frames.items()}
        hoja.save(os.path.join(OUT, 'tex', k + '.png'), optimize=True)
        with open(os.path.join(OUT, 'tex', k + '.json'), 'w', encoding='utf-8') as f:
            json.dump({'frames': jf, 'meta': {'image': k + '.png', 'size': {'w': hoja.size[0], 'h': hoja.size[1]}, 'escalas': escalas}}, f,
                      separators=(',', ':'))
    print(len(texturas) - len(alias), 'texturas,', len(alias), 'duplicadas')
    return alias


def aplicar_alias(alias):
    """Sustituye en las escenas las texturas duplicadas por la que se guardó."""
    for n in os.listdir(os.path.join(OUT, 'escenas')):
        p = os.path.join(OUT, 'escenas', n)
        d = json.load(open(p, encoding='utf-8'))
        for s in d['sprites'] + [s for g in d['grupos'].values() for s in g['sprites']]:
            s[0] = alias.get(s[0], s[0])
        d['texturas'] = sorted({alias.get(t, t) for t in d['texturas']})
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, separators=(',', ':'))


# Texturas que el juego usa directamente (interfaz, rompecabezas, ítems, conceptos)
EXTRAS = {
    'Resources/Sprites/AI-SORA/New-2.png': .5,
    'Resources/Sprites/AI-SORA/Tiempo-2.png': .25,
    'Resources/Sprites/AI-SORA/Distance.png': .35,
    'Resources/Sprites/AI-SORA/speed.png': .25,
    'Resources/Sprites/AI-SORA/equations.png': .25,
    'Resources/Sprites/Abuelo/Isaac_Newton_pixelart 1.png': 1,
    'Resources/Sprites/Abuelo/Isaac_Newton_pixelart 2.png': 1,
    'Resources/Sprites/UI/Crosshairs/crosshairs Static.png': 1,
    'Resources/Sprites/UI/Inventory Pack/blue/slot_UI.png': 1,
    'Resources/Sprites/UI/Inventory Pack/blue/slot_2_UI.png': 1,
    'Resources/Sprites/UI/Text ScreenPads/blue/Text_Screen01.png': 1,
    'Resources/Sprites/Backend/credits vignette.png': 1,
    'Resources/Sprites/Robot/Idle.png': 1,
    'Resources/Sprites/Environment/imagen_2025-06-24_205320522-removebg-preview.png': .15,
    'Resources/Sprites/Environment/imagen_2025-06-24_205300747-removebg-preview.png': .2,
    'Resources/Sprites/Environment/imagen_2025-06-24_204937500-removebg-preview.png': .3,
    'Scenes/2-Menu/Character.png': 1,
    # cuadros de animación de las escenas finales (None = misma escala que los ya usados)
    'Scenes/5-End/Sprites/platformfinal.png': None,
    'Scenes/5-End/Sprites/New-2 1.png': None,
    'Scenes/5-End/Sprites/Tiempo-2 1.png': None,
    'Scenes/5-End/Sprites/Distance 1.png': None,
    'Scenes/5-End/Sprites/speed 1.png': None,
    'Resources/Sprites/Environment/CyberPunk2/Background/3. background layer 1-1.png': 1,
    'Resources/Sprites/Environment/CyberPunk2/Second_Layer/2. second layer 1.png': 1,
    'Scenes/2-Menu/Luz.png': 1,
    'Scenes/2-Menu/Paleta_de_azules.png': 1,
}


def registrar_extras():
    import glob
    rutas = dict(EXTRAS)
    for f in glob.glob(U.ASSETS + '/Resources/Sprites/Num/*.png'):
        rutas[os.path.relpath(f, U.ASSETS).replace(os.sep, '/')] = 1
    for rel, esc in rutas.items():
        tex = U.ASSETS + '/' + rel
        m = U.texmeta(tex)
        if esc is None:
            usados = texturas.get(clave(tex), {}).get('frames', {})
            esc = max((f['max'] for f in usados.values()), default=1) or 1
        sprites = {k: v for k, v in m['sprites'].items() if k != 21300000} or m['sprites']
        for sp in sprites.values():
            registrar({'tex': tex, 'ppu': m['ppu'], **sp}, esc)


def escribir_indice():
    claves = sorted(f[:-5] for f in os.listdir(os.path.join(OUT, 'tex')) if f.endswith('.json'))
    with open(os.path.join(OUT, 'indice.json'), 'w', encoding='utf-8') as f:
        json.dump({'texturas': claves, 'escenas': list(ESCENAS)}, f, ensure_ascii=False, indent=0)


if __name__ == '__main__':
    # Siempre se exportan todas: las texturas se regeneran completas y se comparten entre escenas
    for n in ESCENAS:
        exportar(n, ESCENAS[n])
    registrar_extras()
    aplicar_alias(guardar_texturas())
    escribir_indice()
    total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
    print(f'Total {total / 1e6:.1f} MB')
