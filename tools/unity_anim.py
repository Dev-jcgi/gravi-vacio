"""Resume las curvas de un AnimationClip o AnimatorController de Unity (solo lectura).

Uso: python tools/unity_anim.py <ruta .controller|.anim relativa a Assets>
Imprime, por objeto animado, los cambios de m_IsActive, alfa, posición y escala,
y los eventos (llamadas a funciones) con su tiempo en segundos.
"""
import os
import re
import sys

import yaml

sys.path.insert(0, os.path.dirname(__file__))
import unity_scene as U  # noqa: E402


def clips_de(path):
    if path.endswith('.anim'):
        return [path]
    t = open(path, encoding='utf-8', errors='ignore').read()
    out = []
    for g in dict.fromkeys(re.findall(r'm_Motion: \{fileID: \d+, guid: (\w+)', t)):
        p = U.guidmap().get(g)
        if p and p.endswith('.anim'):
            out.append(p)
    return out


def resumen(clip):
    objs = U.load_unity(clip)
    c = next(o for o in objs.values() if o['_type'] == 'AnimationClip')
    print(f"== {os.path.basename(clip)}  duración {c.get('m_AnimationClipSettings', {}).get('m_StopTime')}  loop {c.get('m_AnimationClipSettings', {}).get('m_LoopTime')}")
    filas = []
    for fc in c.get('m_FloatCurves') or []:
        attr, path = fc['attribute'], fc.get('path') or '.'
        ks = [(round(float(k['time']), 2), round(float(k['value']), 3)) for k in fc['curve']['m_Curve']]
        if attr in ('m_IsActive', 'm_Color.a', 'm_Enabled', 'm_LocalPosition.y', 'm_LocalPosition.x') or 'alpha' in attr.lower() or 'Alpha' in attr:
            filas.append((ks[0][0] if ks else 0, path, attr, ks))
    for kind in ('m_PositionCurves', 'm_ScaleCurves'):
        for pc in c.get(kind) or []:
            ks = [(round(float(k['time']), 2), {a: round(float(v), 3) for a, v in k['value'].items()}) for k in pc['curve']['m_Curve']]
            filas.append((ks[0][0] if ks else 0, pc.get('path') or '.', kind[2:-6], ks))
    for pc in c.get('m_PPtrCurves') or []:
        ks = [(round(float(k['time']), 2), os.path.basename(U.guidmap().get(k['value'].get('guid'), '?'))) for k in pc['curve']]
        filas.append((ks[0][0] if ks else 0, pc.get('path') or '.', pc['attribute'], ks[:4] + (['…'] if len(ks) > 4 else [])))
    for t0, path, attr, ks in sorted(filas, key=lambda f: (f[1], f[2])):
        print(f'  {path} [{attr}] {ks}')
    for e in c.get('m_Events') or []:
        print(f"  EVENTO t={round(float(e['time']), 2)} {e.get('functionName')} {e.get('data') or ''}")


if __name__ == '__main__':
    for clip in clips_de(U.ASSETS + '/' + sys.argv[1]):
        resumen(clip)
