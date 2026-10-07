"""contact sheet of every passage / graphic / photo of a set, labelled with the group it was attached to: python tools/toeic/sheet.py 1 [7|6|g|p1] """
import json, sys
from PIL import Image, ImageDraw
n = sys.argv[1]; what = sys.argv[2] if len(sys.argv) > 2 else '7'
base = 'build/toeic/s%s/' % n
d = json.load(open(base + 'data.json', encoding='utf-8'))
cells = []
P = d['parts']
if what in ('6', '7'):
    for g in P[what]['groups']:
        qs = g['items']
        cells.append(('%s %s' % (g['id'], g['label'][:28]), g['imgs'], qs[0].get('q', '')[:46] or qs[0]['c'][0][:40]))
elif what == 'g':
    for p in ('3', '4'):
        for g in P[p]['groups']:
            for it in g['items']:
                if it.get('img'): cells.append(('Q%d' % it['n'], [it['img']], it['q'][:46]))
elif what == 'p1':
    for it in P['1']['items']: cells.append(('Q%d  ans %s' % (it['n'], 'ABCD'[it['a']]), [it['img']], ''))
W = 420; cols = 4; ims = []
for label, files, sub in cells:
    tiles = []
    for f in files:
        im = Image.open(base + 'img/' + f).convert('RGB'); r = W / im.width
        tiles.append(im.resize((W, max(20, int(im.height * r)))))
    h = sum(t.height for t in tiles) + 6 * len(tiles) + 40
    c = Image.new('RGB', (W, h), 'white'); dr = ImageDraw.Draw(c)
    dr.text((4, 2), label, fill=(200, 0, 0)); dr.text((4, 16), sub, fill=(0, 0, 0))
    y = 34
    for t in tiles: c.paste(t, (0, y)); y += t.height + 6
    ims.append(c)
rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
H = sum(max(c.height for c in r) for r in rows)
sheet = Image.new('RGB', (cols * (W + 8), H), (235, 235, 235)); y = 0
for r in rows:
    for i, c in enumerate(r): sheet.paste(c, (i * (W + 8), y))
    y += max(c.height for c in r)
out = 'build/toeic/_sheet_%s_%s.jpg' % (n, what)
sheet.save(out, quality=80); print(out, sheet.size)
