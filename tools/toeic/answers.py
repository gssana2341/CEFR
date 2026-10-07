"""Reads the filled bubbles of an answer-key sheet (the "เฉลย" pages at the end of each PDF).

The sheet is a picture: 4 columns x 25 rows of (A)(B)(C)(D) circles, the right one filled in. Nothing is guessed:
every row must end up with exactly one filled circle, otherwise the sheet is rejected and the caller has to look at it.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

LETTERS = 'ABCD'
DEBUG = False


def _split_by_largest_gaps(values, parts):
    """sorted 1-D values -> `parts` groups, cut at the (parts-1) biggest gaps"""
    order = np.argsort(values)
    v = np.asarray(values)[order]
    gaps = np.diff(v)
    cuts = sorted(np.argsort(gaps)[-(parts - 1):]) if parts > 1 else []
    groups, start = [], 0
    for c in cuts:
        groups.append(order[start:c + 1])
        start = c + 1
    groups.append(order[start:])
    return groups


def read_sheet(path, rows=25, cols=4):
    """-> list of rows*cols answers (0..3) in question order (column by column), plus the bubble count that was seen"""
    rgb = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
    gray = rgb.mean(axis=2)
    lab, n = ndimage.label(gray < 205, structure=np.ones((3, 3)))
    boxes = ndimage.find_objects(lab)

    sizes = [(s[1].stop - s[1].start, s[0].stop - s[0].start) for s in boxes]
    ringish = [w for (w, h) in sizes if h >= 22 and abs(w - h) <= 4]
    if len(ringish) < rows * cols:
        raise ValueError('too few circles found in %s (%d)' % (path, len(ringish)))
    diam = float(np.median(ringish))

    rings = []
    for s, (w, h) in zip(boxes, sizes):
        if abs(w - diam) <= diam * 0.15 and abs(h - diam) <= diam * 0.15:
            cy = (s[0].start + s[0].stop) / 2
            cx = (s[1].start + s[1].stop) / 2
            r = diam / 2
            yy, xx = np.ogrid[:gray.shape[0], :gray.shape[1]]
            d2 = (yy[int(cy - r - 1):int(cy + r + 2)] - cy) ** 2 + (xx[:, int(cx - r - 1):int(cx + r + 2)] - cx) ** 2
            patch = gray[int(cy - r - 1):int(cy + r + 2), int(cx - r - 1):int(cx + r + 2)]
            ring = (d2 >= (0.55 * r) ** 2) & (d2 <= (0.80 * r) ** 2)
            rings.append((cx, cy, float(patch[ring].mean())))
    if len(rings) < rows * cols * 0.9:
        raise ValueError('only %d circles recognised in %s' % (len(rings), path))

    xs = [r[0] for r in rings]
    out = []
    seen = 0
    for gi, grp in enumerate(_split_by_largest_gaps(xs, cols)):
        col = [rings[i] for i in grp]
        # the x of A, B, C, D in this column
        letter_groups = _split_by_largest_gaps([c[0] for c in col], 4)
        centres = sorted(float(np.mean([col[i][0] for i in g])) for g in letter_groups)
        # rows: same y (within half a circle)
        col.sort(key=lambda c: c[1])
        row_list, cur = [], [col[0]]
        for c in col[1:]:
            if c[1] - np.mean([k[1] for k in cur]) > diam * 0.5:
                row_list.append(cur); cur = [c]
            else:
                cur.append(c)
        row_list.append(cur)
        if len(row_list) != rows:
            raise ValueError('column %d has %d rows (expected %d) in %s' % (gi, len(row_list), rows, path))
        for ri, row in enumerate(row_list):
            filled = []
            for c in row:
                j = int(np.argmin([abs(c[0] - k) for k in centres]))
                seen += 1
                if c[2] < 180:
                    if DEBUG: print(gi, ri + 1, j, round(c[2]))
                    filled.append(j)
            if len(filled) != 1:
                raise ValueError('question %d: %d filled circles in %s' % (gi * rows + ri + 1, len(filled), path))
            out.append(filled[0])
    return out, seen


if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        a, seen = read_sheet(p)
        print(p.split('/')[-1], seen, ''.join(LETTERS[i] for i in a))
