"""print one set compactly for a read-through:  python tools/toeic/dump.py 1 [part ...]"""
import json, sys
n = sys.argv[1]
d = json.load(open('build/toeic/s%s/data.json' % n, encoding='utf-8'))
want = set(sys.argv[2:]) or {'1', '2', '3', '4', '5', '6', '7'}
L = 'ABCD'
def show(it, ind=''):
    c = ' | '.join('%s:%s' % (L[i], t[:38]) for i, t in enumerate(it['c']))
    print('%s%d [%s] %s  >> %s%s' % (ind, it['n'], L[it['a']], (it.get('q') or '')[:110], c, ('  IMG ' + it['img']) if it.get('img') else ''))
for p, part in d['parts'].items():
    if p not in want: continue
    print('--- part', p, (part.get('audio') or {}).get('sec'))
    for it in part.get('items', []): show(it)
    for g in part.get('groups', []):
        print('  [group %s] %s %s' % (g['id'], g.get('label', ''), g.get('imgs', '')))
        for it in g['items']: show(it, '    ')
