"""Aplana una escena de Unity (.unity) con sus prefabs anidados y exporta sprites,
colisionadores y scripts en coordenadas de mundo. Solo lee el proyecto Unity."""
import copy, glob, json, math, os, pickle, re, sys
import yaml

ROOT = 'E:/jc-gi/Gravi_Claude'
ASSETS = ROOT + '/Assets'
MASK = 0x7FFFFFFFFFFFFFFF
DOC_RE = re.compile(r'^--- !u!(\d+) &(-?\d+)( stripped)?[^\n]*$', re.M)
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'guidmap.pkl')

_guid = None
def guidmap():
    global _guid
    if _guid is None:
        if os.path.exists(CACHE):
            _guid = pickle.load(open(CACHE, 'rb'))
        else:
            _guid = {}
        if not any(v.startswith(ASSETS) for v in _guid.values()):
            _guid = {}
            for m in glob.glob(ASSETS + '/**/*.meta', recursive=True):
                try:
                    g = re.search(r'guid: (\w+)', open(m, encoding='utf-8', errors='ignore').read(3000)).group(1)
                    _guid[g] = m[:-5].replace('\\', '/')
                except Exception:
                    pass
            pickle.dump(_guid, open(CACHE, 'wb'))
    return _guid

def load_unity(path):
    text = open(path, encoding='utf-8', errors='ignore').read()
    parts = DOC_RE.split(text)
    objs = {}
    for i in range(1, len(parts), 4):
        cls, fid, stripped, body = int(parts[i]), int(parts[i + 1]), bool(parts[i + 2]), parts[i + 3]
        try:
            d = yaml.load(body, Loader=yaml.CSafeLoader) or {}
        except Exception as e:
            print('yaml error', path, fid, e, file=sys.stderr)
            continue
        typ, data = next(iter(d.items())) if d else ('?', {})
        o = dict(data or {})
        o['_cls'], o['_type'], o['_stripped'] = cls, typ, stripped
        objs[fid] = o
    return objs

def conv(v):
    if isinstance(v, str):
        try:
            return int(v)
        except ValueError:
            try:
                return float(v)
            except ValueError:
                return v
    return v

def assign(c, k, v):
    c[k] = v

def setpath(obj, path, value, ref):
    toks = path.split('.')
    container, key, i = obj, toks[0], 1
    while i < len(toks):
        t = toks[i]
        cur = container.get(key) if isinstance(container, dict) else (container[key] if key < len(container) else None)
        if t == 'Array':
            nt = toks[i + 1]
            if not isinstance(cur, list):
                cur = []
                assign(container, key, cur)
            if nt == 'size':
                n = int(conv(value) or 0)
                while len(cur) < n:
                    cur.append({})
                del cur[n:]
                return
            k = int(nt[5:-1])
            while len(cur) <= k:
                cur.append({})
            container, key, i = cur, k, i + 2
        else:
            if not isinstance(cur, dict):
                cur = {}
                assign(container, key, cur)
            container, key, i = cur, t, i + 1
    old = container.get(key) if isinstance(container, dict) else container[key]
    if (ref and ref.get('fileID')) or isinstance(old, dict) and 'fileID' in old:
        assign(container, key, ref or {'fileID': 0})
    else:
        assign(container, key, conv(value))

def remap(o, ids, inst):
    if isinstance(o, dict):
        if 'fileID' in o and 'guid' not in o and len(o) <= 2:
            f = o['fileID']
            if f in ids:
                return {'fileID': (inst ^ f) & MASK}
            return o
        return {k: remap(v, ids, inst) if not k.startswith('_') else v for k, v in o.items()}
    if isinstance(o, list):
        return [remap(v, ids, inst) for v in o]
    return o

_flat = {}
def flatten(path):
    if path in _flat:
        return _flat[path]
    objs = load_unity(path)
    out = {f: o for f, o in objs.items() if not o['_stripped'] and o['_cls'] != 1001}
    for fid, o in objs.items():
        if o['_cls'] != 1001:
            continue
        mod = o.get('m_Modification') or {}
        src = guidmap().get(o['m_SourcePrefab'].get('guid'))
        if not src or not os.path.exists(src):
            print('prefab no encontrado', o['m_SourcePrefab'], file=sys.stderr)
            continue
        pobjs = flatten(src)
        ids = set(pobjs)
        removed = {(fid ^ r['fileID']) & MASK for r in (mod.get('m_RemovedComponents') or []) if r.get('fileID')}
        removed |= {(fid ^ r['fileID']) & MASK for r in (mod.get('m_RemovedGameObjects') or []) if r.get('fileID')}
        new = {}
        for sid, so in pobjs.items():
            nid = (fid ^ sid) & MASK
            if nid in removed:
                continue
            no = remap(copy.deepcopy(so), ids, fid)
            no['_prefab'] = no.get('_prefab') or src
            no['_inst'] = fid
            new[nid] = no
        for m in mod.get('m_Modifications') or []:
            t = (fid ^ m['target']['fileID']) & MASK
            if t in new:
                try:
                    setpath(new[t], m['propertyPath'], m.get('value'), m.get('objectReference'))
                except Exception as e:
                    print('mod error', m['propertyPath'], e, file=sys.stderr)
        parent = (mod.get('m_TransformParent') or {}).get('fileID', 0)
        for no in new.values():
            if no['_cls'] in (4, 224) and not (no.get('m_Father') or {}).get('fileID'):
                if no.get('_inst') == fid and not no.get('_rooted'):
                    no['m_Father'] = {'fileID': parent}
                    no['_rooted'] = True
        out.update(new)
    _flat[path] = out
    return out

# ---------- sprites ----------
_meta = {}
ALIGN = {0: (.5, .5), 1: (0, 1), 2: (.5, 1), 3: (1, 1), 4: (0, .5), 5: (1, .5), 6: (0, 0), 7: (.5, 0), 8: (1, 0)}
def texmeta(tex):
    if tex in _meta:
        return _meta[tex]
    d = yaml.load(open(tex + '.meta', encoding='utf-8', errors='ignore').read(), Loader=yaml.CSafeLoader)
    ti = d.get('TextureImporter', {})
    from PIL import Image
    W, H = Image.open(tex).size
    ppu = float(ti.get('spritePixelsToUnits', 100))
    sprites = {}
    if int(ti.get('spriteMode', 1)) == 2:
        names = {}
        for k, v in (ti.get('fileIDToRecycleName') or {}).items():
            names[v] = int(k)
        for e in ti.get('internalIDToNameTable') or []:
            names[e['second']] = int(list(e['first'].values())[0])
        for k, v in (ti.get('nameFileIdTable') or {}).items():
            names[k] = int(v)
        for s in (ti.get('spriteSheet') or {}).get('sprites') or []:
            r = s['rect']
            al = int(s.get('alignment', 0))
            pv = ALIGN.get(al, (s.get('pivot', {}).get('x', .5), s.get('pivot', {}).get('y', .5)))
            fid = int(s.get('internalID') or 0) or names.get(s['name'])
            sprites[fid] = {'name': s['name'], 'x': r['x'], 'y': H - r['y'] - r['height'], 'w': r['width'], 'h': r['height'], 'px': pv[0], 'py': pv[1]}
    al = int(ti.get('alignment', 0))
    sp = ti.get('spritePivot') or {'x': .5, 'y': .5}
    pv = ALIGN.get(al, (sp['x'], sp['y']))
    sprites[21300000] = sprites.get(21300000) or {'name': os.path.basename(tex)[:-4], 'x': 0, 'y': 0, 'w': W, 'h': H, 'px': pv[0], 'py': pv[1]}
    _meta[tex] = {'ppu': ppu, 'sprites': sprites, 'W': W, 'H': H}
    return _meta[tex]

def sprite_info(ref):
    if not ref or not ref.get('fileID'):
        return None
    g = ref.get('guid')
    tex = guidmap().get(g)
    if not tex or not tex.lower().endswith(('.png', '.jpg', '.jpeg', '.psd', '.tga')):
        return {'tex': None, 'guid': g, 'fileID': ref['fileID']}
    m = texmeta(tex)
    s = m['sprites'].get(ref['fileID'])
    if s is None:
        if len(m['sprites']) == 1 or ref['fileID'] == 21300000:
            s = m['sprites'][21300000]
        else:
            return {'tex': tex, 'missing': ref['fileID']}
    return {'tex': tex, 'ppu': m['ppu'], **s}

# ---------- transforms ----------
def quat_mat(q):
    x, y, z, w = q.get('x', 0), q.get('y', 0), q.get('z', 0), q.get('w', 1)
    return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z)]]

def scene(path):
    objs = flatten(path)
    gos = {f: o for f, o in objs.items() if o['_cls'] == 1}
    trs = {o['m_GameObject']['fileID']: (f, o) for f, o in objs.items() if o['_cls'] in (4, 224) and o.get('m_GameObject')}
    tr_by_id = {f: o for f, o in objs.items() if o['_cls'] in (4, 224)}
    world = {}

    def wt(tid, depth=0):
        if tid in world:
            return world[tid]
        t = tr_by_id.get(tid)
        if t is None or depth > 64:
            return ([1, 0, 0, 1, 0, 0], 0, True, '', [])
        p = t.get('m_LocalPosition') or {}
        s = t.get('m_LocalScale') or {}
        R = quat_mat(t.get('m_LocalRotation') or {})
        sx, sy = float(s.get('x', 1)), float(s.get('y', 1))
        a, b, c, d = R[0][0] * sx, R[0][1] * sy, R[1][0] * sx, R[1][1] * sy
        tx, ty, tz = float(p.get('x', 0)), float(p.get('y', 0)), float(p.get('z', 0))
        if t['_cls'] == 224:
            ap = t.get('m_AnchoredPosition') or {}
            tx, ty = float(ap.get('x', 0)), float(ap.get('y', 0))
        gid = (t.get('m_GameObject') or {}).get('fileID')
        go = gos.get(gid, {})
        active = int(go.get('m_IsActive', 1)) == 1
        name = str(go.get('m_Name', '?'))
        fid = (t.get('m_Father') or {}).get('fileID', 0)
        if fid and fid in tr_by_id:
            (pa, pb, pc, pd, ptx, pty), pz, pact, pname, pids = wt(fid, depth + 1)
            m = [pa * a + pb * c, pa * b + pb * d, pc * a + pd * c, pc * b + pd * d, pa * tx + pb * ty + ptx, pc * tx + pd * ty + pty]
            res = (m, pz + tz, pact and active, pname + '/' + name, pids + [gid])
        else:
            res = ([a, b, c, d, tx, ty], tz, active, name, [gid])
        world[tid] = res
        return res

    comps_de = {}
    for f, o in objs.items():
        if o['_cls'] not in (1, 4, 224) and isinstance(o.get('m_GameObject'), dict):
            comps_de.setdefault(o['m_GameObject'].get('fileID'), []).append(o)
    scripts = {}
    out = {'sprites': [], 'colliders': [], 'objects': [], 'scripts': [], 'tiles': []}
    for gid, go in gos.items():
        if gid not in trs:
            continue
        tid, t = trs[gid]
        m, z, act, hpath, ids = wt(tid)
        # Componentes por m_GameObject (incluye los añadidos en variantes de prefab, que no están en m_Component)
        comps = comps_de.get(gid, [])
        anim = None
        info = {'name': str(go.get('m_Name')), 'path': hpath, 'active': act, 'tag': go.get('m_TagString'), 'layer': go.get('m_Layer'),
                'm': [round(v, 5) for v in m], 'z': round(z, 4), 'id': gid, 'tid': tid, 'ids': ids, 'ui': t['_cls'] == 224,
                'selfActive': int(go.get('m_IsActive', 1)) == 1}
        kinds = []
        for c in comps:
            ct = c['_cls']
            en = int(c.get('m_Enabled', 1)) == 1
            if ct == 212:
                si = sprite_info(c.get('m_Sprite'))
                col = c.get('m_Color') or {}
                out['sprites'].append({**info, 'enabled': en, 'sprite': si, 'layerID': c.get('m_SortingLayerID', 0), 'order': c.get('m_SortingOrder', 0),
                                       'color': [col.get('r', 1), col.get('g', 1), col.get('b', 1), col.get('a', 1)],
                                       'flipX': c.get('m_FlipX', 0), 'flipY': c.get('m_FlipY', 0), 'drawMode': c.get('m_DrawMode', 0),
                                       'size': c.get('m_Size')})
                kinds.append('sprite')
            elif ct in (61, 60, 68, 58, 70, 19719996, 66):
                e = {**info, 'enabled': en, 'cls': ct, 'trigger': int(c.get('m_IsTrigger', 0)), 'composite': int(c.get('m_UsedByComposite', 0)) or (c.get('m_CompositeOperation', 0) not in (0, None)),
                     'offset': c.get('m_Offset'), 'size': c.get('m_Size'), 'radius': c.get('m_Radius')}
                if ct == 60:
                    e['paths'] = (c.get('m_Points') or {}).get('m_Paths')
                if ct == 68:
                    e['points'] = c.get('m_Points')
                if ct == 70:
                    e['direction'] = c.get('m_Direction')
                out['colliders'].append(e)
                kinds.append('collider%d' % ct)
            elif ct == 50:
                kinds.append('rb')
                info['rb'] = {'type': c.get('m_BodyType'), 'gravity': c.get('m_GravityScale'), 'mass': c.get('m_Mass')}
            elif ct == 95:
                ctrl = guidmap().get((c.get('m_Controller') or {}).get('guid'))
                info['animator'] = ctrl
                kinds.append('animator')
            elif ct == 1839735485:
                kinds.append('tilemap')
                grid = (t.get('m_Father') or {}).get('fileID')
                gcell = {'x': 1, 'y': 1}
                g = tr_by_id.get(grid)
                if g:
                    for cc in gos.get(g['m_GameObject']['fileID'], {}).get('m_Component') or []:
                        oc = objs.get(cc['component']['fileID'])
                        if oc and oc['_cls'] == 156049354:
                            gcell = oc.get('m_CellSize') or gcell
                sprs = [sprite_info(e['m_Data']) for e in c.get('m_TileSpriteArray') or []]
                mats = [e['m_Data'] for e in c.get('m_TileMatrixArray') or []]
                cols = [e['m_Data'] for e in c.get('m_TileColorArray') or []]
                anc = c.get('m_TileAnchor') or {'x': .5, 'y': .5}
                tr = None
                for cc in comps:
                    if cc['_cls'] == 483693784:
                        tr = cc
                tiles = []
                for e in c.get('m_Tiles') or []:
                    p, s = e.get('first') or {}, e.get('second') or {}
                    tiles.append({'x': p.get('x', 0), 'y': p.get('y', 0), 's': s.get('m_TileSpriteIndex', 0), 'mt': s.get('m_TileMatrixIndex', 0), 'c': s.get('m_TileColorIndex', 0)})
                out['tiles'].append({**info, 'cell': gcell, 'anchor': anc, 'sprites': sprs, 'matrices': mats, 'colors': cols, 'tiles': tiles,
                                     'layerID': (tr or {}).get('m_SortingLayerID', 0), 'order': (tr or {}).get('m_SortingOrder', 0)})
            elif ct == 20:
                info['camera'] = {'ortho': float(c.get('orthographic size') or 5), 'enabled': en}
                kinds.append('camera')
            elif ct == 82:
                clip = guidmap().get(((c.get('m_audioClip') or c.get('m_AudioClip')) or {}).get('guid'))
                if clip:
                    info.setdefault('audio', []).append({'clip': os.path.basename(clip), 'awake': int(c.get('m_PlayOnAwake', 0)), 'loop': int(c.get('Loop', 0)), 'enabled': en})
            elif ct == 114 and 'm_Text' in c:
                fd = c.get('m_FontData') or {}
                col = c.get('m_Color') or {}
                info['text'] = {'text': c.get('m_Text'), 'size': fd.get('m_FontSize'), 'align': fd.get('m_Alignment'),
                                'color': [col.get('r', 1), col.get('g', 1), col.get('b', 1), col.get('a', 1)]}
                kinds.append('text')
            elif ct == 114:
                sg = (c.get('m_Script') or {}).get('guid')
                sp = guidmap().get(sg, sg)
                nm = os.path.basename(sp or '?').replace('.cs', '')
                if sp and sp.endswith('.cs'):
                    fields = {k: v for k, v in c.items() if not k.startswith('m_') and not k.startswith('_')}
                    out['scripts'].append({**info, 'script': nm, 'enabled': en, 'fields': fields})
                    kinds.append(nm)
                elif nm not in ('?',):
                    kinds.append('ui:' + nm[:8])
        info['kinds'] = kinds
        out['objects'].append(info)
    return out

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    data = scene(src)
    json.dump(data, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, default=str)
    print(src, 'sprites', len(data['sprites']), 'colliders', len(data['colliders']), 'tilemaps', len(data['tiles']), 'scripts', len(data['scripts']))
