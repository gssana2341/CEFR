"""The "Ebook เสริมคะแนน" folder (grammar tricks, 200 words, 120 phrases) -> pictures of the content pages.

    python tools/toeic/extract_tips.py --src "C:/Users/me/Downloads/Toeic" --out build/toeic

Their Thai text is not readable as text (the fonts have no Unicode map) and the phrase book is a picture anyway, so each content page is
kept as a picture exactly as printed: nothing is retyped, nothing can be mistranslated. Covers and the advertising pages are left out.
Output: build/toeic/tips/data.json + tips/img/*.webp  (git-ignored; upload.mjs sends it to the private bucket with the sets)
"""
import argparse
import json
import re
import shutil
from pathlib import Path

import pymupdf
from PIL import Image

WIDTH = 1500          # px: small table text stays readable and a page stays a few hundred KB


def find_pdfs(src):
    folder = next(p for p in src.iterdir() if p.is_dir() and 'Ebook' in p.name)
    out = {}
    for f in folder.glob('*.pdf'):
        if f.name.startswith('120'):
            out['phrases'] = f
        elif f.name.startswith('5 '):
            out['grammar'] = f
        elif '200' in f.name:
            out['vocab'] = f
    missing = {'phrases', 'grammar', 'vocab'} - set(out)
    if missing:
        raise SystemExit('ebook PDFs not found: %s in %s' % (sorted(missing), folder))
    return out


def render(page, path):
    z = WIDTH / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z))
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=86, method=6)
    return im.size


def vocab_pages(doc):
    """pages that hold word tables = at least ~15 numbered English rows in the text layer (covers and ads have none)"""
    keep = []
    for i, p in enumerate(doc):
        rows = [l for l in p.get_text().splitlines() if re.fullmatch(r'\d{1,3}', l.strip())]
        words = [l for l in p.get_text().splitlines() if re.fullmatch(r'[A-Za-z][A-Za-z ]{2,}', l.strip())]
        if len(rows) >= 15 and len(words) >= 15:
            keep.append(i)
    return keep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', default='build/toeic')
    a = ap.parse_args()
    pdfs = find_pdfs(Path(a.src))
    root = Path(a.out) / 'tips'
    shutil.rmtree(root, ignore_errors=True)

    sections = []

    g = pymupdf.open(pdfs['grammar'])
    pages = []
    caps = ['Subject-Verb Agreement · Passive Voice · Suffix', 'Suffix (ต่อ) · คำเชื่อม · Tenses']
    for i in range(len(g)):
        name = 'g%d.webp' % (i + 1)
        render(g[i], root / 'img' / name)
        pages.append({'img': name, 'cap': 'หน้า %d · %s' % (i + 1, caps[i] if i < len(caps) else '')})
    sections.append({'id': 'grammar', 'title': '5 แกรมมาร์ที่ออกสอบ TOEIC บ่อยที่สุด', 'sub': 'สูตร วิธีดู และตัวอย่างข้อสอบ พร้อมเฉลยเหตุผล', 'pages': pages})

    v = pymupdf.open(pdfs['vocab'])
    keep = vocab_pages(v)
    if len(keep) != 10:
        raise SystemExit('expected 10 vocabulary pages (20 categories), found %s' % keep)
    pages = []
    for n, i in enumerate(keep):
        name = 'v%02d.webp' % (n + 1)
        render(v[i], root / 'img' / name)
        pages.append({'img': name, 'cap': 'หมวด %d–%d' % (n * 2 + 1, n * 2 + 2)})
    sections.append({'id': 'vocab', 'title': 'ศัพท์ TOEIC 200 คำ 20 หมวด', 'sub': 'คำศัพท์ ชนิดคำ และความหมาย แยกตามหัวข้อที่ออกสอบ', 'pages': pages})

    p = pymupdf.open(pdfs['phrases'])
    topics = ['Meetings & Scheduling', 'Emails & Office Communication', 'Customer Service & Complaints',
              'Maintenance & Facilities', 'Purchasing & Orders', 'Human Resources & Employment']
    pages = []
    for n in range(6):                      # page 0 is the cover, the last three are advertising
        name = 'ph%d.webp' % (n + 1)
        render(p[n + 1], root / 'img' / name)
        pages.append({'img': name, 'cap': 'วลี %d–%d · %s' % (n * 20 + 1, n * 20 + 20, topics[n])})
    sections.append({'id': 'phrases', 'title': '120 วลีที่ออกสอบ TOEIC และใช้ทำงานจริง', 'sub': 'ประโยคพร้อมคำแปล 6 หมวดงานออฟฟิศ', 'pages': pages})

    (root / 'data.json').write_text(json.dumps({'sections': sections}, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(f.stat().st_size for f in (root / 'img').glob('*.webp'))
    print('tips: %d pages, %.1f MB -> %s' % (sum(len(s['pages']) for s in sections), total / 1048576, root))


if __name__ == '__main__':
    main()
