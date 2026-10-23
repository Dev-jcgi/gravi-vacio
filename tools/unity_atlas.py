"""Convierte el recorte de sprites de Unity (.meta, spriteMode Multiple) a un atlas JSON de Phaser."""
import json, re, sys
from PIL import Image

def convert(png, out_json, out_png=None, prefix=''):
    meta = open(png + '.meta', encoding='utf-8').read()
    im = Image.open(png); W, H = im.size
    frames = {}
    for m in re.finditer(r'- serializedVersion: 2\s+name: (.+?)\s+rect:\s+serializedVersion: 2\s+x: ([\d.]+)\s+y: ([\d.]+)\s+width: ([\d.]+)\s+height: ([\d.]+)', meta):
        name, x, y, w, h = m.group(1).strip(), *[int(float(v)) for v in m.groups()[1:]]
        # Unity mide y desde abajo; Phaser desde arriba
        frames[prefix + name] = {'frame': {'x': x, 'y': H - y - h, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
                                  'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h}}
    data = {'frames': frames, 'meta': {'image': (out_png or png).split('/')[-1], 'size': {'w': W, 'h': H}, 'scale': '1'}}
    json.dump(data, open(out_json, 'w', encoding='utf-8'), indent=0)
    if out_png: im.save(out_png, optimize=True)
    return frames

if __name__ == '__main__':
    f = convert(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    print(len(f), 'frames')
