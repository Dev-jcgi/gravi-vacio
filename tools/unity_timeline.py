"""Lista las pistas y clips de los Timeline (.playable) de una escena de Unity (solo lectura).

Uso: python tools/unity_timeline.py <escena .unity relativa a Assets>
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import unity_scene as U  # noqa: E402


def nombre_script(o):
    p = U.guidmap().get((o.get('m_Script') or {}).get('guid'), '')
    return os.path.basename(p).replace('.cs', '') or (o.get('m_EditorClassIdentifier') or '?').split('::')[-1]


def main(rel):
    objs = U.flatten(U.ASSETS + '/' + rel)
    gos = {f: o for f, o in objs.items() if o['_cls'] == 1}
    trs = {f: o for f, o in objs.items() if o['_cls'] in (4, 224)}

    def ruta(fid):
        o = objs.get(fid)
        if not o:
            return f'?{fid}'
        if o['_cls'] != 1:
            o = gos.get((o.get('m_GameObject') or {}).get('fileID'), {})
        nombre = [str(o.get('m_Name'))]
        t = next((tr for tr in trs.values() if (tr.get('m_GameObject') or {}).get('fileID') in (fid, o.get('_id'))), None)
        return '/'.join(nombre)

    for d in (o for o in objs.values() if o['_cls'] == 320):
        asset = U.guidmap().get((d.get('m_PlayableAsset') or {}).get('guid'))
        if not asset:
            continue
        binds = {b['key']['fileID']: b['value'].get('fileID') for b in d.get('m_SceneBindings') or []}
        tl = U.load_unity(asset)
        print('== Timeline', os.path.basename(asset))
        filas = []
        for fid, o in tl.items():
            if 'm_Clips' not in o:
                continue
            tipo = nombre_script(o)
            destino = binds.get(fid)
            dest = ruta(destino) if destino else ''
            for c in o.get('m_Clips') or []:
                a = tl.get((c.get('m_Asset') or {}).get('fileID'), {})
                extra = ''
                if a.get('m_Clip'):
                    extra = os.path.basename(U.guidmap().get(a['m_Clip'].get('guid'), '?'))
                filas.append((float(c['m_Start']), float(c['m_Duration']), tipo, o.get('m_Name'), dest, c.get('m_DisplayName'), extra))
            for m in o.get('m_Markers', {}).get('m_Objects') or []:
                mk = tl.get(m.get('fileID'), {})
                filas.append((float(mk.get('m_Time', 0)), 0, 'Marker', o.get('m_Name'), dest, nombre_script(mk), ''))
        for f in sorted(filas):
            print(f'  t={f[0]:7.2f} dur={f[1]:6.2f} {f[2]:<16} pista="{f[3]}" -> {f[4]} | {f[5]} {f[6]}')


if __name__ == '__main__':
    main(sys.argv[1])
