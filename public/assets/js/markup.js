// "Mark up the sentence like on paper": after an answer, draw arcs ABOVE the sentence from a clue word to the
// word it controls, with a short label on each arc and small captions (S, V2 …) UNDER words.
// Also renders the tense card (name, formula, rules, signal words, 12-tense grid).
//
// Annotation (assets/data/clues-*.js), looked up by bank + key:
//   { links: [[from, to, label], …],   // arc from → to; to = null draws a callout with just the label
//     tags:  [[word, caption], …],     // small caption under a word
//     tense: 'past-simple',            // show the tense card
//     lesson: 'past-simple',           // link to a lesson
//     tip:  'ทางลัด …' }               // one-line shortcut
// Endpoints are exact substrings of the sentence (the blank is filled with the correct answer first);
// "was@2" means the 2nd occurrence.
(function () {
  'use strict';

  const { h } = window.CEFR;
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uidCounter = 0;   // unique marker ids so several diagrams on one page never share an arrowhead

  const D = () => window.CEFR_DATA || {};
  const tenses = () => D().tenses || [];

  // ---------- lookup ----------
  function annotation(bank, key) {
    const c = (D().clues || {})[bank];
    if (!c) return null;
    if (bank === 'lessons') {            // key = "lesson-id#exerciseIndex"
      const [lid, idx] = String(key).split('#');
      return (c[lid] || {})[idx] || null;
    }
    return c[key] || null;
  }

  // ---------- text model ----------
  const isLetter = (ch) => /[A-Za-z0-9']/.test(ch || '');

  // every occurrence of `needle` in `text` on word boundaries (falls back to case-insensitive)
  function findAll(text, needle) {
    for (const hay of [text, text.toLowerCase()]) {
      const n = hay === text ? needle : needle.toLowerCase();
      const out = [];
      let from = 0;
      for (;;) {
        const i = hay.indexOf(n, from);
        if (i < 0) break;
        const okL = !isLetter(n[0]) || !isLetter(hay[i - 1]);
        const okR = !isLetter(n[n.length - 1]) || !isLetter(hay[i + n.length]);
        if (okL && okR) out.push([i, i + n.length]);
        from = i + 1;
      }
      if (out.length) return out;
    }
    return [];
  }

  const parseEp = (s) => {
    const m = String(s).match(/^(.*)@(\d+)$/);
    return m ? { text: m[1], nth: Number(m[2]) } : { text: String(s), nth: 1 };
  };

  // Fill the blanks of the question with the correct answer; returns rows [{ text, fills: [[s, e]] }]
  function buildRows(q, answer) {
    const blanks = q.match(/_{3,}/g) || [];
    let parts = [answer];
    if (blanks.length > 1) {
      const split = answer.split(' / ');
      parts = split.length === blanks.length ? split : [answer];
    }
    let bi = 0;
    return q.split('\n').map((line) => {
      let text = '';
      const fills = [];
      let last = 0;
      for (const m of line.matchAll(/_{3,}/g)) {
        text += line.slice(last, m.index);
        const fill = bi < parts.length ? parts[bi] : null;
        bi++;
        if (fill !== null) { fills.push([text.length, text.length + fill.length]); text += fill; } else text += m[0];
        last = m.index + m[0].length;
      }
      text += line.slice(last);
      return { text, fills };
    });
  }

  // Resolve an annotation against the text: which words get marked, which arcs join them.
  // `missing` lists endpoints that are not found / overlap another mark (the validator reports these).
  function plan(q, answer, ann) {
    const rows = buildRows(q, answer);
    const missing = [];
    const ambiguous = [];
    const marks = [];                         // { id, row, s, e, tag }
    const markAt = (row, s, e) => {
      let m = marks.find((x) => x.row === row && x.s === s && x.e === e);
      if (!m) {
        // ignore marks that partially overlap an existing one in the same row
        if (marks.some((x) => x.row === row && s < x.e && e > x.s)) return null;
        m = { id: marks.length, row, s, e, tag: null };
        marks.push(m);
      }
      return m;
    };
    const explicit = (ep) => /@\d+$/.test(String(ep));
    const locate = (ep, preferRow) => {
      const { text, nth } = parseEp(ep);
      const order = rows.map((_, i) => i);
      if (preferRow !== undefined) order.sort((x, y) => (x === preferRow ? -1 : y === preferRow ? 1 : x - y));
      const hits = [];                          // [row, [s, e]] in reading order of `order`
      for (const i of order) findAll(rows[i].text, text).forEach((r) => hits.push([i, r]));
      const inFill = ([i, r]) => rows[i].fills.some(([fs, fe]) => r[0] < fe && r[1] > fs);
      let pick = null;
      if (explicit(ep)) pick = hits[nth - 1];
      else {
        // no @n: the filled-in answer wins, otherwise the first hit
        pick = hits.find(inFill) || hits[0];
        if (pick && hits.length > 1 && !inFill(pick)) ambiguous.push(text);
      }
      return pick ? markAt(pick[0], pick[1][0], pick[1][1]) : null;
    };

    const links = [];
    for (const [from, to, label] of ann.links || []) {
      const a = locate(from);
      if (!a) { missing.push(from); continue; }
      const b = to ? locate(to, a.row) : null;
      if (to && !b) { missing.push(to); continue; }
      links.push({ a, b, label: label || '' });
    }
    for (const [word, cap] of ann.tags || []) {
      const m = locate(word);
      if (m) m.tag = cap;
      else missing.push(word);
    }
    return { rows, marks, links, missing, ambiguous };
  }

  // ---------- the diagram ----------
  // Every sentence is laid out by hand into visual lines (so it wraps on a phone), each line gets its own
  // headroom for the arcs above it and a strip below it for the captions.
  function diagram(q, answer, ann) {
    const { rows, marks, links } = plan(q, answer, ann);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'dg-svg');
    svg.setAttribute('aria-hidden', 'true');
    const inner = h('div', { class: 'dg-inner' }, svg);
    const wrap = h('div', { class: 'dg', 'data-tr': true }, inner);
    const mid = 'dg-arrow-' + (++uidCounter);

    let lines = [];                 // [{ row, s, e, el }] visual lines, top to bottom
    let drawnWidth = 0;
    let animated = false;

    // characters [s0, e0) of logical row ri as one visual line
    function renderLine(ri, s0, e0) {
      const r = rows[ri];
      const cuts = new Set([s0, e0]);
      const cut = (x) => { if (x > s0 && x < e0) cuts.add(x); };
      r.fills.forEach(([s, e]) => { cut(s); cut(e); });
      marks.filter((m) => m.row === ri).forEach((m) => { cut(m.s); cut(m.e); });
      const bounds = [...cuts].sort((x, y) => x - y);
      const line = h('div', { class: 'dg-row' });
      for (let k = 0; k < bounds.length - 1; k++) {
        const s = bounds[k];
        const e = bounds[k + 1];
        const txt = r.text.slice(s, e);
        const fill = r.fills.some(([fs, fe]) => s >= fs && e <= fe);
        const mk = marks.find((m) => m.row === ri && s >= m.s && e <= m.e);
        if (!fill && !mk) { line.append(txt); continue; }
        line.append(h('span', { class: (fill ? 'dg-fill ' : '') + (mk ? 'dg-mk' : ''), 'data-mk': mk ? String(mk.id) : null, text: txt }));
      }
      return line;
    }

    // rect of character i inside a rendered line
    function charRect(lineEl, i) {
      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT);
      let node;
      let off = 0;
      while ((node = walker.nextNode())) {
        if (i < off + node.data.length) {
          const rg = document.createRange();
          rg.setStart(node, i - off);
          rg.setEnd(node, i - off + 1);
          return rg.getBoundingClientRect();
        }
        off += node.data.length;
      }
      return lineEl.getBoundingClientRect();
    }

    // greedy word wrap of a logical row into [start, end) character ranges that fit `avail` px
    function breakRow(ri, avail) {
      const text = rows[ri].text;
      const flat = renderLine(ri, 0, text.length);
      flat.classList.add('dg-measure');
      inner.append(flat);
      const out = [];
      let start = Math.max(0, text.search(/\S/));
      let lastEnd = start;
      const re = /\S+/g;
      let m;
      while ((m = re.exec(text))) {
        const ws = m.index;
        const we = ws + m[0].length;
        if (ws > start && charRect(flat, we - 1).right - charRect(flat, start).left > avail && lastEnd > start) {
          out.push([start, lastEnd]);
          start = ws;
        }
        lastEnd = we;
      }
      out.push([start, lastEnd]);
      flat.remove();
      return out;
    }

    function layout() {
      inner.querySelectorAll('.dg-row').forEach((el) => el.remove());
      const avail = Math.max(120, wrap.clientWidth - 2);
      lines = [];
      rows.forEach((r, ri) => {
        breakRow(ri, avail).forEach(([s, e]) => {
          const el = renderLine(ri, s, e);
          inner.insertBefore(el, svg);
          lines.push({ row: ri, s, e, el });
        });
      });
    }

    // box of a mark, relative to the diagram; a mark that wraps uses its widest piece
    function boxOf(id, base) {
      const pieces = new Map();
      inner.querySelectorAll('[data-mk="' + id + '"]').forEach((el) => {
        const rc = el.getBoundingClientRect();
        const p = pieces.get(el.parentNode);
        if (!p) pieces.set(el.parentNode, { l: rc.left, r: rc.right, t: rc.top, b: rc.bottom });
        else { p.l = Math.min(p.l, rc.left); p.r = Math.max(p.r, rc.right); p.t = Math.min(p.t, rc.top); p.b = Math.max(p.b, rc.bottom); }
      });
      const all = [];
      pieces.forEach((p, el) => all.push({
        l: p.l - base.left, r: p.r - base.left, t: p.t - base.top, b: p.b - base.top,
        cx: (p.l + p.r) / 2 - base.left, line: lines.findIndex((x) => x.el === el),
      }));
      if (!all.length) return { l: 0, r: 0, t: 0, b: 0, cx: 0, line: 0, all: [] };
      all.sort((x, y) => x.line - y.line);
      const widest = all.reduce((best, p) => (p.r - p.l > best.r - best.l ? p : best));
      return Object.assign({}, widest, { all });
    }

    function draw() {
      const boxes = new Map();
      let base = inner.getBoundingClientRect();
      const measure = () => {
        base = inner.getBoundingClientRect();
        marks.forEach((m) => boxes.set(m.id, boxOf(m.id, base)));
      };
      measure();
      const bx = (m) => boxes.get(m.id);
      // a link between two lines uses the pieces that face each other (matters when a phrase wraps)
      const facing = (k) => {
        const a = bx(k.a);
        const b = bx(k.b);
        const down = a.line < b.line;
        const A = down ? a.all[a.all.length - 1] : a.all[0];
        const B = down ? b.all[0] : b.all[b.all.length - 1];
        return A.line !== B.line ? [A, B] : [a, b];
      };

      // 1) headroom above each line (from the arcs that start on it) and captions below it
      const inLine = links.filter((k) => !k.b || bx(k.a).line === bx(k.b).line);
      const cross = links.filter((k) => k.b && bx(k.a).line !== bx(k.b).line);
      const levelOf = new Map();
      lines.forEach((ln, li) => {
        const mine = inLine.filter((k) => bx(k.a).line === li);
        const span = (k) => (k.b ? Math.abs(bx(k.a).cx - bx(k.b).cx) : 0);
        mine.sort((x, y) => span(x) - span(y));
        mine.forEach((k, i) => levelOf.set(k, i));
        let pad = mine.length ? 26 + 20 * mine.length : 8;
        if (cross.some((k) => Math.max(...facing(k).map((e) => e.line)) === li)) pad = Math.max(pad, 54);
        ln.el.style.paddingTop = pad + 'px';
        // captions: a caption goes on a second strip when it would run into its neighbour
        const tagged = marks.filter((m) => m.tag && bx(m).line === li).sort((x, y) => bx(x).cx - bx(y).cx);
        const edges = [];
        tagged.forEach((m) => {
          const w = m.tag.length * 6.4;
          let strip = edges.findIndex((edge) => bx(m).cx - w / 2 > edge + 6);
          if (strip < 0) strip = edges.length;
          edges[strip] = bx(m).cx + w / 2;
          m.strip = strip;
        });
        ln.el.style.paddingBottom = tagged.length ? 6 + 13 * edges.length + 'px' : '2px';
      });

      // 2) measure again with the new spacing and draw
      measure();
      const W = inner.clientWidth;
      const H = inner.offsetHeight;
      svg.setAttribute('width', String(W));
      svg.setAttribute('height', String(H));
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.replaceChildren();

      const defs = document.createElementNS(NS, 'defs');
      const marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', mid);
      marker.setAttribute('viewBox', '0 0 8 8');
      marker.setAttribute('refX', '6');
      marker.setAttribute('refY', '4');
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('orient', 'auto');
      const tip = document.createElementNS(NS, 'path');
      tip.setAttribute('d', 'M0 0 L8 4 L0 8 z');
      tip.setAttribute('class', 'dg-arrowhead');
      marker.append(tip);
      defs.append(marker);
      svg.append(defs);

      const addPath = (d, arrow) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('class', 'dg-line');
        if (arrow) p.setAttribute('marker-end', 'url(#' + mid + ')');
        svg.append(p);
        return p;
      };
      // text centred on x, kept inside the diagram
      const addText = (x, y, str, cls, leftEdge) => {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('y', String(y));
        t.setAttribute('class', cls);
        t.textContent = str;
        svg.append(t);
        const len = t.getComputedTextLength ? t.getComputedTextLength() : 0;
        if (leftEdge) {                               // text starts at x (beside a line), pulled back if it would leave the box
          t.setAttribute('x', String(Math.max(2, Math.min(x, W - len - 2))));
        } else {
          t.setAttribute('text-anchor', 'middle');
          const half = len / 2 + 2;
          t.setAttribute('x', String(half * 2 >= W ? W / 2 : Math.max(half, Math.min(W - half, x))));
        }
        return t;
      };

      // several arrows into / out of one word: spread them so the heads do not pile up
      const ends = new Map();
      const addEnd = (m, k, side, otherCx) => {
        if (!ends.has(m)) ends.set(m, []);
        ends.get(m).push({ k, side, otherCx });
      };
      links.forEach((k) => {
        if (!k.b) return;
        addEnd(k.a, k, 'a', bx(k.b).cx);
        addEnd(k.b, k, 'b', bx(k.a).cx);
      });
      const shift = new Map();
      ends.forEach((list, m) => {
        const box = bx(m);
        const room = Math.max(0, (box.r - box.l) / 2 - 4);
        list.sort((x, y) => x.otherCx - y.otherCx).forEach((e, i) => {
          const off = list.length > 1 ? Math.max(-room, Math.min(room, (i - (list.length - 1) / 2) * 12)) : 0;
          shift.set(e.k, Object.assign(shift.get(e.k) || {}, { [e.side]: off }));
        });
      });

      const pieces = [];
      links.forEach((k) => {
        const sh = shift.get(k) || {};
        const a0 = bx(k.a);
        if (!k.b) {                                   // callout: tick + label above the word
          const hgt = 20 * (levelOf.get(k) + 1);
          const p = addPath('M' + a0.cx + ' ' + (a0.t - 2) + ' L' + a0.cx + ' ' + (a0.t - hgt + 6), false);
          const t = addText(a0.cx, a0.t - hgt, k.label, 'dg-label');
          pieces.push({ p, t });
          return;
        }
        const b0 = bx(k.b);
        const sameLine = a0.line === b0.line;
        const [a, b] = sameLine ? [a0, b0] : facing(k);
        const ax = a.cx + (sh.a || 0);
        const bX = b.cx + (sh.b || 0);
        if (sameLine) {                               // arc above the line
          const hgt = 12 + 20 * levelOf.get(k) + Math.min(14, Math.abs(a.cx - b.cx) / 14);
          const top = Math.min(a.t, b.t) - 2;
          const cy = top - 2 * hgt;
          const p = addPath('M' + ax + ' ' + top + ' Q' + (ax + bX) / 2 + ' ' + cy + ' ' + bX + ' ' + top, true);
          const t = addText((ax + bX) / 2, top - hgt - 4, k.label, 'dg-label');
          pieces.push({ p, t });
        } else if (a.line < b.line) {                 // clue on an earlier line → target on a later line
          const y1 = a.b + 2 + (k.a.tag ? 13 * ((k.a.strip || 0) + 1) + 4 : 0);   // start below the caption under the clue
          const y2 = b.t - 4;
          const p = addPath('M' + ax + ' ' + y1 + ' C' + ax + ' ' + (y1 + 16) + ' ' + bX + ' ' + (y2 - 22) + ' ' + bX + ' ' + y2, true);
          const t = addText(Math.max(ax, bX) + 10, (y1 + y2) / 2 + 4, k.label, 'dg-label', true);
          pieces.push({ p, t });
        } else {                                      // clue on a later line → target on an earlier line (arrow points up)
          const y1 = a.t - 2;
          const y2 = b.b + 3 + (k.b.tag ? 13 * ((k.b.strip || 0) + 1) + 4 : 0);   // stop below the caption under the target
          const p = addPath('M' + ax + ' ' + y1 + ' C' + ax + ' ' + (y1 - 16) + ' ' + bX + ' ' + (y2 + 22) + ' ' + bX + ' ' + y2, true);
          const t = addText(Math.max(ax, bX) + 10, (y1 + y2) / 2 + 4, k.label, 'dg-label', true);
          pieces.push({ p, t });
        }
      });
      marks.filter((m) => m.tag).forEach((m) => {
        const box = bx(m);
        pieces.push({ t: addText(box.cx, box.b + 13 + 13 * (m.strip || 0), m.tag, 'dg-tag') });
      });

      // "draw it by hand": strokes appear one after another (first paint only)
      if (!animated && !reduceMotion) {
        pieces.forEach((pc, i) => {
          const delay = 220 + i * 260;
          if (pc.p) {
            const L = pc.p.getTotalLength();
            pc.p.style.strokeDasharray = String(L);
            pc.p.style.strokeDashoffset = String(L);
            requestAnimationFrame(() => requestAnimationFrame(() => {
              pc.p.style.transition = 'stroke-dashoffset 420ms ease-out ' + delay + 'ms';
              pc.p.style.strokeDashoffset = '0';
            }));
          }
          pc.t.style.opacity = '0';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            pc.t.style.transition = 'opacity 300ms ease-out ' + (delay + 260) + 'ms';
            pc.t.style.opacity = '1';
          }));
        });
      }
      animated = true;
    }

    // plain text first, so the sentence is there even before the first measurement
    rows.forEach((r, ri) => {
      const el = renderLine(ri, 0, r.text.length);
      inner.insertBefore(el, svg);
      lines.push({ row: ri, s: 0, e: r.text.length, el });
    });
    const refresh = () => { layout(); draw(); };
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => {
        const w = inner.clientWidth;
        if (w > 0 && w !== drawnWidth) { drawnWidth = w; refresh(); }
      }).observe(inner);
    } else {
      requestAnimationFrame(refresh);
    }
    // the web font arrives after the first paint and changes every width
    if (document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(() => { if (inner.clientWidth > 0) refresh(); });
    }
    return wrap;
  }

  // ---------- tense card ----------
  const GROUPS = [['past', 'อดีต'], ['present', 'ปัจจุบัน'], ['future', 'อนาคต']];
  const KINDS = [['simple', 'Simple'], ['continuous', 'Continuous'], ['perfect', 'Perfect'], ['perfectcont', 'Perfect Continuous']];

  function tenseGrid(activeId, linkCells) {
    const list = tenses();
    const cell = (grp, kind) => {
      const t = list.find((x) => x.group === grp && x.kind === kind);
      if (!t) return h('td');
      const inner = [h('strong', { text: t.short })];
      return h('td', { class: 'tg-cell' + (t.id === activeId ? ' on' : '') },
        linkCells ? h('a', { href: 'tenses.html#' + t.id, title: t.en + ' · ' + t.th }, inner) : h('span', { title: t.en + ' · ' + t.th }, inner));
    };
    return h('div', { class: 'table-wrap' },
      h('table', { class: 'table tgrid' },
        h('thead', {}, h('tr', {}, h('th', { text: '' }), GROUPS.map(([, th]) => h('th', { text: th })))),
        h('tbody', {}, KINDS.map(([kind, label]) => h('tr', {},
          h('th', { text: label }),
          GROUPS.map(([grp]) => cell(grp, kind)))))));
  }

  function tenseDetail(t) {
    return h('div', { class: 'tense-body' },
      h('table', { class: 'table tform' },
        h('tbody', {},
          h('tr', {}, h('th', { text: 'บอกเล่า (+)' }), h('td', { text: t.form.aff })),
          h('tr', {}, h('th', { text: 'ปฏิเสธ (−)' }), h('td', { text: t.form.neg })),
          h('tr', {}, h('th', { text: 'คำถาม (?)' }), h('td', { text: t.form.q })))),
      h('p', { class: 'tense-h', text: 'ใช้เมื่อ' }),
      h('ul', { class: 'tense-use', 'data-tr': true }, t.use.map((u) => h('li', { text: u }))),
      h('p', { class: 'tense-h', text: 'คำบอกเวลาที่มักเจอ (signal words)' }),
      h('p', { class: 'tense-signals', 'data-tr': true }, t.signals.map((s) => h('span', { class: 'sig', text: s }))),
      h('p', { class: 'tense-tip', 'data-tr': true }, h('strong', { text: 'จำไว้ · ' }), t.tip),
      h('ul', { class: 'examples' }, t.examples.map(([en, th]) => h('li', {},
        h('span', { class: 'ex-en', 'data-tr': true, text: en }), h('span', { class: 'ex-th', text: th })))));
  }

  function tenseCard(id) {
    const t = tenses().find((x) => x.id === id);
    if (!t) return null;
    return h('details', { class: 'tense-card', open: true },
      h('summary', {}, h('span', { class: 'tense-name' }, 'Tense: ', h('strong', { text: t.en }), ' · ' + t.th)),
      tenseDetail(t),
      h('details', { class: 'tense-grid-wrap' },
        h('summary', { text: 'ดูตาราง 12 tenses (ช่องที่ไฮไลต์คือ tense ของข้อนี้)' }),
        tenseGrid(id, true),
        h('a', { class: 'link-btn', href: 'tenses.html#' + id, text: 'เปิดหน้าสรุปกฎ 12 tenses →' })));
  }

  // ---------- the block shown in the feedback ----------
  // opts: { bank, key, q, answer }  → element, or null when the question has no annotation
  function block(opts) {
    const ann = annotation(opts.bank, opts.key);
    if (!ann) return null;
    const box = h('div', { class: 'clue-box' }, h('p', { class: 'clue-title', text: 'จุดสังเกตในประโยค — ดูตรงไหนถึงตอบได้ไว' }));
    if ((ann.links && ann.links.length) || (ann.tags && ann.tags.length)) box.append(diagram(opts.q, opts.answer, ann));
    if (ann.tip) box.append(h('p', { class: 'clue-tip', 'data-tr': true }, h('strong', { text: 'ทางลัด · ' }), ann.tip));
    if (ann.tense) box.append(tenseCard(ann.tense));
    if (ann.lesson) box.append(h('p', { class: 'clue-more' }, h('a', { class: 'link-btn', href: 'learn.html#' + ann.lesson, text: 'อ่านบทเรียนที่เกี่ยวข้อง →' })));
    return box;
  }

  window.CEFR.markup = { block, annotation, plan, tenseGrid, tenseDetail, tenseCard };
})();
