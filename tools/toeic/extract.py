"""TOEIC practice book -> structured content (questions, answer key, pictures, audio).

    python tools/toeic/extract.py --src "C:/Users/me/Downloads/Toeic" --out build/toeic

Runs on the machine only. The output (build/) is git-ignored and must never be committed: the book is
copyrighted, and the repository is public. `upload.mjs` pushes it to the private store.

How each kind of page is read
  - pages with a text layer  -> text lines with their position (exact, no OCR)
  - pages that are only a picture (all of Listening in set 1, a few others) -> OCR (rapidocr, offline)
  - answer key = a picture of filled bubbles -> answers.py (every row must have exactly one filled circle)
  - passages (Part 6/7 e-mails, notices, tables), photos (Part 1) and graphics (Part 3/4) -> cropped as pictures
Anything it is not sure about is written to report.txt instead of being guessed.
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops

sys.path.insert(0, str(Path(__file__).parent))
from answers import read_sheet, LETTERS  # noqa: E402

# 1-based page numbers inside each PDF (checked by eye against the contact sheets; the asserts below catch a wrong guess)
LAYOUT = {
    1: dict(l_text=(8, 23), reading=(25, 65), key_l=67, key_r=68, part1=(4, 6)),
    2: dict(l_text=(8, 24), reading=(26, 64), key_l=66, key_r=67, part1=(4, 6)),
    3: dict(l_text=(8, 22), reading=(24, 65), key_l=67, key_r=68, part1=(4, 6)),
}
PARTS = {1: (1, 6), 2: (7, 31), 3: (32, 70), 4: (71, 100), 5: (101, 130), 6: (131, 146), 7: (147, 200)}
FOOT_Y = 785          # footer ("สงวนสิทธิ์…", page number) starts below this (pt)
TOP_Y = 88            # the logo header ends above this
GAP = 13              # max gap (pt) between two lines that still belong to the same block of text

report = []
_ovf = Path(__file__).parent / 'overrides.json'
OV = json.loads(_ovf.read_text(encoding='utf-8')) if _ovf.exists() else {}


def warn(msg):
    report.append(msg)
    print('  !', msg)


class Line:
    __slots__ = ('page', 'x0', 'y0', 'x1', 'y1', 'text')

    def __init__(self, page, x0, y0, x1, y1, text):
        self.page, self.x0, self.y0, self.x1, self.y1, self.text = page, x0, y0, x1, y1, text.strip()

    @property
    def col(self):
        return 1 if self.x0 >= 290 else 0


_ocr = None


def ocr_lines(page, pno, dpi=200):
    global _ocr
    if _ocr is None:
        from rapidocr_onnxruntime import RapidOCR
        _ocr = RapidOCR()
    import numpy as np
    pix = page.get_pixmap(dpi=dpi)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
    res, _ = _ocr(img)
    k = 72.0 / dpi
    out = []
    for box, text, score in (res or []):
        xs = [p[0] for p in box]
        ys = [p[1] for p in box]
        m = re.match(r'^([0-9OoIl]{1,3})(\s*\..*)$', text)
        if m and re.search(r'\d', m.group(1)) and re.search(r'[OoIl]', m.group(1)):
            text = m.group(1).translate(str.maketrans('OoIl', '0011')) + m.group(2)
        out.append(Line(pno, min(xs) * k, min(ys) * k, max(xs) * k, max(ys) * k, text))
    return out


def page_lines(page, pno, allow_ocr=True):
    """the text lines of a page, in points; vector text when there is a text layer, OCR when the page is just a picture"""
    lines = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            t = ''.join(s['text'] for s in l['spans']).replace('\u00a0', ' ')
            if t.strip():
                lines.append(Line(pno, *l['bbox'], t))
    lines = [l for l in lines if not (l.y0 >= FOOT_Y - 8 or 'สงวนสิทธิ์' in l.text or re.fullmatch(r'page\s*\d+', l.text.strip(), re.I))]
    vector = bool(lines)
    if not lines and allow_ocr:
        lines = [l for l in ocr_lines(page, pno) if l.y0 < FOOT_Y - 8 and not re.fullmatch(r'page\s*\d+', l.text.strip(), re.I)]
        return lines, 'ocr'
    return lines, 'text' if vector else 'none'


CHOICE = re.compile(r'\(([A-D])\)\s*')


def merge_choice_rows(lines):
    """"(A) 1   (B) 2   (C) 3   (D) 4" is laid out as four separate pieces on one row (and may straddle the column split): glue them"""
    rows = {}
    for l in lines:
        rows.setdefault((l.page, round(l.y0 / 3)), []).append(l)
    out = []
    for grp in rows.values():
        real = [l for l in grp if l.text.strip()]
        real.sort(key=lambda l: l.x0)
        if len(real) == 4 and all(CHOICE.match(l.text) for l in real) and ''.join(CHOICE.match(l.text).group(1) for l in real) == 'ABCD':
            out.append(Line(real[0].page, real[0].x0, min(l.y0 for l in real), max(l.x1 for l in real), max(l.y1 for l in real),
                            ' '.join(l.text for l in real)))
        else:
            out += grp
    return out
QSTART = re.compile(r'^(\d{1,3})\s*\.\s*(.*)$')
HEADER = re.compile(r'^Questions?\s*\d+', re.I)


def add_choice(cur, part):
    m = CHOICE.match(part)
    letter = m.group(1)
    if letter in cur['cd']:
        cur['dup'] = True
    cur['cd'][letter] = part[m.end():].strip()
    cur['last'] = letter


def parse_items(lines, lo, hi):
    """lines (any order) -> { n: {stem, c:[...], page, y} } for question numbers lo..hi"""
    items = {}
    cur = None
    prev = None
    lines = merge_choice_rows(lines)
    twocol = {}
    for l in lines:
        m = QSTART.match(l.text)
        if m and lo <= int(m.group(1)) <= hi and l.x0 >= 290:
            twocol[l.page] = True
    colof = lambda l: l.col if twocol.get(l.page) else 0            # a page with one column of questions may still lay its choices out as a 2x2 grid
    key = lambda l: (l.page, colof(l), l.y0) if twocol.get(l.page) else (l.page, 0, round(l.y0 / 4), l.x0)
    for l in sorted(lines, key=key):
        t = l.text
        if HEADER.match(t) or re.match(r'^PART\s*\d', t, re.I):
            cur = None
            prev = l
            continue
        m = QSTART.match(t)
        if m and lo <= int(m.group(1)) <= hi and int(m.group(1)) not in items:
            cur = {'stem': m.group(2).strip(), 'cd': {}, 'last': None, 'c': [], 'page': l.page, 'y': l.y0, 'n': int(m.group(1))}
            items[cur['n']] = cur
            rest = cur['stem']
            if CHOICE.search(rest):                      # "139. (A) …" on one line
                head, *parts = re.split(r'(?=\([A-D]\)\s)', rest)
                cur['stem'] = head.strip()
                for p in parts:
                    add_choice(cur, p)
            prev = l
            continue
        if cur is None:
            prev = l
            continue
        same_block = prev is not None and prev.page == l.page and colof(prev) == colof(l) and (l.y0 - prev.y1 <= GAP) and (l.y0 >= prev.y0 - 3)
        if CHOICE.match(t):
            for p in re.split(r'(?=\([A-D]\)\s)', t):
                if p.strip():
                    add_choice(cur, p)
            prev = l
        elif same_block or (not cur['cd'] and prev is not None and prev.page == l.page):
            if cur['last']:
                cur['cd'][cur['last']] = (cur['cd'][cur['last']] + ' ' + t).strip()
            else:
                cur['stem'] = (cur['stem'] + ' ' + t).strip()
            prev = l
        else:
            cur = None
            prev = l
    for it in items.values():                                       # choices are placed by their printed letter, never by arrival order
        it['c'] = [it['cd'][k] for k in 'ABCD' if k in it['cd']]
        if it.get('dup') or sorted(it['cd']) != list('ABCD')[:len(it['cd'])]:
            warn('Q%d: choice letters %s%s' % (it['n'], ''.join(sorted(it['cd'])), ' (a letter appeared twice)' if it.get('dup') else ''))
    return items


def clean_text(t, stem=False):
    for a, b in OV.get('replace', []):
        t = t.replace(a, b)
    t = re.sub(r'\s{2,}', ' ', t).strip()
    return t[:1].upper() + t[1:] if stem and t[:1].islower() and len(t) > 12 else t


def trim(im, pad=10):
    bg = Image.new(im.mode, im.size, (255, 255, 255))
    bbox = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 14 else 0).getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def save_clip(page, rect, path, dpi, maxw=1300):
    pix = page.get_pixmap(dpi=dpi, clip=rect)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    im = trim(im)
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=82, method=6)
    return im.size


def big_images(page):
    out = []
    for im in page.get_image_info():
        x0, y0, x1, y1 = im['bbox']
        w, h = x1 - x0, y1 - y0
        if w >= 90 and h >= 60 and w * h < 0.8 * page.rect.width * page.rect.height and y0 >= TOP_Y - 20:
            out.append(pymupdf.Rect(x0, y0, x1, y1))
    out.sort(key=lambda r: (round(r.y0 / 8), r.x0))
    return out


def find_sheet(doc, pno):
    page = doc[pno - 1]
    last = None
    for x in page.get_images(full=True):
        pix = pymupdf.Pixmap(doc, x[0])
        if pix.n >= 4:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        tmp = Path('build') / '_sheet.png'
        tmp.parent.mkdir(exist_ok=True)
        pix.save(str(tmp))
        try:
            return read_sheet(str(tmp))[0]
        except ValueError as e:
            last = e
    raise SystemExit('answer sheet on page %d unreadable: %s' % (pno, last))


def extract_set(n, pdf, audio_dir, out, dpi):
    L = LAYOUT[n]
    print('== set %d' % n)
    doc = pymupdf.open(pdf)
    sd = out / ('s%d' % n)
    shutil.rmtree(sd, ignore_errors=True)
    (sd / 'img').mkdir(parents=True)
    (sd / 'audio').mkdir()

    # ---- answer key -------------------------------------------------------------------------------------------
    key = find_sheet(doc, L['key_l']) + find_sheet(doc, L['key_r'])          # index 0 = question 1
    assert len(key) == 200
    for q in range(7, 32):
        if key[q - 1] == 3:
            warn('set %d Q%d: key says D but Part 2 has only A-C' % (n, q))

    # ---- text -------------------------------------------------------------------------------------------------
    srcs = {}
    l_lines, r_lines = [], []
    for pno in range(L['l_text'][0], L['l_text'][1] + 1):
        ls, how = page_lines(doc[pno - 1], pno)
        srcs[pno] = how
        l_lines += ls
    for pno in range(L['reading'][0], L['reading'][1] + 1):
        ls, how = page_lines(doc[pno - 1], pno)
        srcs[pno] = how
        r_lines += ls
    print('  text source per page:', ', '.join('%d:%s' % (p, h) for p, h in srcs.items() if h != 'text') or 'all text layer')

    listening = parse_items(l_lines, 32, 100)
    reading = parse_items(r_lines, 101, 200)
    items = {**listening, **reading}
    for q, o in OV.get(str(n), {}).items():
        old = items.get(int(q), {'n': int(q), 'page': 0, 'y': 0, 'stem': '', 'c': []})
        items[int(q)] = {**old, 'stem': o.get('q', old['stem']), 'c': o.get('c', old['c'])}
    for it in items.values():
        it['stem'] = clean_text(it['stem'], stem=True)
        it['c'] = [clean_text(c) for c in it['c']]
    for it in items.values():                     # "In which of the positions marked [1]-[4]" : the choices are just the four marks
        if re.search(r'positions? marked', it['stem']):
            it['c'] = ['[1]', '[2]', '[3]', '[4]']

    # ---- sanity: complete, 4 choices (Part 5/6/7, 3/4), in order -------------------------------------------------
    for q in range(32, 201):
        it = items.get(q)
        if not it:
            warn('set %d Q%d not found' % (n, q))
            continue
        if len(it['c']) != 4:
            warn('set %d Q%d has %d choices: %r' % (n, q, len(it['c']), it['c']))
        if 101 <= q <= 130 and not it['stem']:
            warn('set %d Q%d (Part 5) has no stem' % (n, q))

    # ---- Part 1 photos ------------------------------------------------------------------------------------------
    photos = []
    for pno in range(L['part1'][0], L['part1'][1] + 1):
        for r in big_images(doc[pno - 1]):
            photos.append((pno, r))
    if len(photos) != 6:
        warn('set %d: expected 6 Part 1 photos, found %d' % (n, len(photos)))
    p1 = []
    for i, (pno, r) in enumerate(photos[:6], 1):
        name = 'q%d.webp' % i
        save_clip(doc[pno - 1], r, sd / 'img' / name, dpi)
        p1.append({'n': i, 'img': name, 'c': list('ABCD'), 'a': key[i - 1]})

    # ---- graphics of Part 3/4 ("Look at the graphic") ----------------------------------------------------------
    gq = [q for q in range(32, 101) if q in items and re.search(r'graphic', items[q]['stem'], re.I)]
    gimgs = []
    for pno in range(L['l_text'][0], L['l_text'][1] + 1):
        for r in big_images(doc[pno - 1]):
            gimgs.append((pno, r))
    graphics = {}
    manual = OV.get('graphics', {}).get(str(n))
    if manual:
        for q, g in manual.items():
            name = 'g%s.webp' % q
            save_clip(doc[g['page'] - 1], pymupdf.Rect(*g['rect']), sd / 'img' / name, dpi)
            graphics[int(q)] = name
        if sorted(graphics) != gq:
            warn('set %d: graphic questions %s but overrides cover %s' % (n, gq, sorted(graphics)))
    elif len(gq) == len(gimgs):
        for q, (pno, r) in zip(gq, gimgs):
            name = 'g%d.webp' % q
            save_clip(doc[pno - 1], r, sd / 'img' / name, dpi)
            graphics[q] = name
    else:
        warn('set %d: %d graphic questions %s but %d pictures on pages %s - match by hand (overrides.json)'
             % (n, len(gq), gq, len(gimgs), [p for p, _ in gimgs]))
        for i, (pno, r) in enumerate(gimgs):          # still saved, so the review page can show them
            save_clip(doc[pno - 1], r, sd / 'img' / ('loose_p%d_%d.webp' % (pno, i)), dpi)

    # ---- Part 6/7 groups and their passage pictures -------------------------------------------------------------
    groups = []
    cur = None
    started = False
    qn_pages = {it['n']: it for it in reading.values()}
    by_page = {}
    for l in r_lines:
        by_page.setdefault(l.page, []).append(l)
    for pno in range(L['reading'][0], L['reading'][1] + 1):
        page = doc[pno - 1]
        ls = sorted(by_page.get(pno, []), key=lambda l: l.y0)
        events = []
        for l in ls:
            if re.match(r'^PART\s*6', l.text, re.I):
                started = True
            if not started:
                continue
            if re.match(r'^PART\s*7', l.text, re.I):
                events.append((l.y0, 'X', None))              # the Part 7 heading ends whatever Part 6 passage is above it
            elif HEADER.match(l.text):
                events.append((l.y0, 'H', l))
            else:
                m = QSTART.match(l.text)
                if m and int(m.group(1)) in qn_pages and qn_pages[int(m.group(1))]['page'] == pno and qn_pages[int(m.group(1))]['y'] == l.y0 and int(m.group(1)) >= 131:
                    events.append((l.y0, 'Q', int(m.group(1))))
        if not started:
            continue
        # a Part 6 passage that sits on the page of the "PART 6" heading starts below the heading/directions block
        clip_start = TOP_Y if cur is not None else None
        for y, kind, v in events + [(FOOT_Y, 'E', None)]:
            if kind == 'H':
                if cur is not None and clip_start is not None and y - 2 - clip_start > 30:
                    cur['clips'].append((pno, clip_start, y - 2))
                mm = re.search(r'following\s*(.*)$', v.text, re.I)
                label = (mm.group(1) if mm else '').strip(' :.')
                cur = {'label': label, 'qs': [], 'clips': [], 'hdr': v}
                groups.append(cur)
                clip_start = v.y1 + 3
            elif kind in ('Q', 'X'):
                if cur is not None and clip_start is not None and y - 2 - clip_start > 30:
                    cur['clips'].append((pno, clip_start, y - 2))
                clip_start = None
                if cur is not None and kind == 'Q':
                    cur['qs'].append(v)
            else:
                if cur is not None and clip_start is not None and FOOT_Y - clip_start > 30:
                    cur['clips'].append((pno, clip_start, FOOT_Y))
                clip_start = None
        # a picture next to the questions (not above them) leaves no vertical room for a clip: take the picture itself
        hdrs = [(y, v) for y, k, v in events if k == 'H']
        for r in big_images(page):
            owner = cur
            for y, v in hdrs:
                if y < r.y0 + 5:
                    owner = next((g for g in groups if g['hdr'] is v), owner)
            if owner is None:
                continue
            if not any(c[0] == pno and c[1] - 4 <= r.y0 and r.y1 <= c[2] + 4 for c in owner['clips']):
                owner['clips'].append((pno, r.y0 - 3, r.y1 + 3, r.x0 - 10, r.x1 + 10))
    p6, p7 = [], []
    for g in groups:
        if not g['qs']:
            warn('set %d: a passage group ("%s") has no questions' % (n, g['label']))
            continue
        qs = sorted(set(g['qs']))
        first = qs[0]
        imgs = []
        for k, c in enumerate(sorted(g['clips'], key=lambda c: (c[0], c[1]))):
            pno, y0, y1 = c[:3]
            xr = (c[3], c[4]) if len(c) > 3 else (30, doc[pno - 1].rect.width - 30)
            name = 'p%d_%d.webp' % (first, k)
            w, h = save_clip(doc[pno - 1], pymupdf.Rect(xr[0], y0, xr[1], y1), sd / 'img' / name, dpi)
            if h < 40:
                (sd / 'img' / name).unlink()
                continue
            imgs.append(name)
        if not imgs:
            warn('set %d: group %d-%d has no passage picture' % (n, qs[0], qs[-1]))
        grp = {'id': '%d-%d' % (qs[0], qs[-1]), 'label': g['label'], 'imgs': imgs,
               'items': [{'n': q, **({'q': items[q]['stem']} if items[q]['stem'] else {}), 'c': items[q]['c'], 'a': key[q - 1]} for q in qs]}
        (p6 if qs[0] <= 146 else p7).append(grp)
    got = sorted(q for g in p6 + p7 for q in (i['n'] for i in g['items']))
    if got != list(range(131, 201)):
        warn('set %d: Part 6/7 groups cover %s' % (n, sorted(set(range(131, 201)) - set(got)) or 'extra numbers'))

    # ---- assemble ---------------------------------------------------------------------------------------------
    def listen_groups(lo, hi):
        out_g = []
        for start in range(lo, hi + 1, 3):
            its = []
            for q in range(start, start + 3):
                it = items.get(q)
                if not it:
                    continue
                d = {'n': q, 'q': it['stem'], 'c': it['c'], 'a': key[q - 1]}
                if q in graphics:
                    d['img'] = graphics[q]
                its.append(d)
            out_g.append({'id': '%d-%d' % (start, start + 2), 'items': its})
        return out_g

    from mutagen.mp3 import MP3
    parts = {}
    for p in (1, 2, 3, 4):
        src = next(Path(audio_dir).glob('*Part %d.mp3' % p), None)
        audio = None
        if src:
            shutil.copyfile(src, sd / 'audio' / ('part%d.mp3' % p))
            audio = {'file': 'audio/part%d.mp3' % p, 'sec': round(MP3(str(src)).info.length, 1), 'bytes': src.stat().st_size}
        else:
            warn('set %d: audio for Part %d missing' % (n, p))
        parts[str(p)] = {'audio': audio}
    parts['1']['items'] = p1
    parts['2']['items'] = [{'n': q, 'c': list('ABC'), 'a': key[q - 1]} for q in range(7, 32)]
    parts['3']['groups'] = listen_groups(32, 70)
    parts['4']['groups'] = listen_groups(71, 100)
    parts['5'] = {'items': [{'n': q, 'q': items[q]['stem'], 'c': items[q]['c'], 'a': key[q - 1]} for q in range(101, 131) if q in items]}
    parts['6'] = {'groups': p6}
    parts['7'] = {'groups': p7}

    data = {'id': n, 'title': 'ชุดที่ %d' % n, 'parts': parts}
    (sd / 'data.json').write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print('  written', sd / 'data.json')
    return data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='folder that contains "ข้อสอบพร้อมเสียง 1" … 3')
    ap.add_argument('--out', default='build/toeic')
    ap.add_argument('--sets', type=int, nargs='*', default=[1, 2, 3])
    ap.add_argument('--dpi', type=int, default=170)
    a = ap.parse_args()
    src, out = Path(a.src), Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    index = []
    for n in a.sets:
        folder = next(src.glob('*%d' % n))
        pdf = next(folder.glob('*TOEIC*.pdf'))
        audio_dir = next(p for p in folder.iterdir() if p.is_dir())
        d = extract_set(n, pdf, audio_dir, out, a.dpi)
        index.append({'id': n, 'title': d['title']})
    (out / 'index.json').write_text(json.dumps({'sets': index}, ensure_ascii=False, indent=1), encoding='utf-8')
    (out / 'report.txt').write_text('\n'.join(report) or 'no warnings', encoding='utf-8')
    print('\n%d warning(s); see %s' % (len(report), out / 'report.txt'))


if __name__ == '__main__':
    main()
