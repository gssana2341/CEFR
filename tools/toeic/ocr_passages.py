"""Part 6/7 passage pictures and the Part 3/4 graphics -> their text (offline OCR), for writing the notes and for "show the text" after answering.

    python tools/toeic/ocr_passages.py --out build/toeic

Writes build/toeic/sN/passages.json = { "<group id>": "text…", "g<question>": "text…" }. English text OCR is good; tables and forms come out in reading
order, which is enough to read them. Stays in build/ (git-ignored).
"""
import argparse
import json
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='build/toeic')
    ap.add_argument('--sets', type=int, nargs='*', default=[1, 2, 3])
    a = ap.parse_args()
    from rapidocr_onnxruntime import RapidOCR
    import numpy as np
    from PIL import Image
    ocr = RapidOCR()
    root = Path(a.out)

    def read(path):
        im = Image.open(path).convert('RGB')
        if im.width < 1100:                                   # small graphics: upscale so thin type is read
            r = 1100 / im.width
            im = im.resize((1100, int(im.height * r)), Image.LANCZOS)
        res, _ = ocr(np.asarray(im))
        lines = sorted(res or [], key=lambda x: (round(min(p[1] for p in x[0]) / 14), min(p[0] for p in x[0])))
        out, cur_y, cur = [], None, []
        for box, text, _ in lines:                            # join the pieces that sit on one printed line
            y = round(min(p[1] for p in box) / 14)
            if cur_y is not None and y != cur_y:
                out.append(' '.join(cur)); cur = []
            cur_y = y
            cur.append(text)
        if cur:
            out.append(' '.join(cur))
        return '\n'.join(out)

    for s in a.sets:
        d = json.loads((root / ('s%d' % s) / 'data.json').read_text(encoding='utf-8'))
        res = {}
        for p in ('3', '4', '6', '7'):
            for g in d['parts'][p]['groups']:
                if g.get('imgs'):
                    res[g['id']] = '\n\n'.join(read(root / ('s%d' % s) / 'img' / im) for im in g['imgs'])
                for q in g['items']:
                    if q.get('img'):
                        res['g%d' % q['n']] = read(root / ('s%d' % s) / 'img' / q['img'])
        (root / ('s%d' % s) / 'passages.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
        print('set %d: %d texts' % (s, len(res)), flush=True)


if __name__ == '__main__':
    main()
