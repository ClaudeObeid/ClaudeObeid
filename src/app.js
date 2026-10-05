(function () {
'use strict';

/* ================= helpers ================= */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var ar = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }); };
var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* DOM builder: any text that comes from the content files goes through textContent, never innerHTML */
function h(tag, p, kids) {
  var e = document.createElement(tag); p = p || {};
  Object.keys(p).forEach(function (k) {
    var v = p[k];
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'on') Object.keys(v).forEach(function (ev) { e.addEventListener(ev, v[ev]); });
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  (kids || []).forEach(function (c) {
    if (c === null || c === undefined || c === false) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}
/* trusted, generated-by-this-file SVG only */
function ico(svg, cls, tag) { var e = document.createElement(tag || 'div'); if (cls) e.className = cls; e.innerHTML = svg; return e; }
function svgUse(id, cls) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (cls) s.setAttribute('class', cls);
  s.setAttribute('aria-hidden', 'true');
  var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', '#' + id); s.appendChild(u); return s;
}
var norm = function (s) {
  return (s || '').normalize('NFKD')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 1632); })
    .toLowerCase().replace(/\s+/g, ' ').trim();
};
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

/* ================= data ================= */
var D = JSON.parse($('#data').textContent);
var HOOKS = {}; /* the preview's try-it editor attaches here; empty on the real site */
function editing() { return PREVIEW && document.body.classList.contains('edit'); }
var PREVIEW = !!D.preview;
var SITE = D.site || {};
var CH = D.chapters || [];
var BOOK_TITLE = SITE.book_title || 'كتاب العمر';
var PHRASES = (SITE.phrases && SITE.phrases.length) ? SITE.phrases : ['اللون ذاكرة', 'وللحكاية بقية', 'لكل مرحلة لونها'];
var ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة', 'الخامسة عشرة', 'السادسة عشرة', 'السابعة عشرة', 'الثامنة عشرة', 'التاسعة عشرة', 'العشرون'];
function ordinal(i) { return 'المرحلة ' + (i < ORD.length ? ORD[i] : ar(i + 1)); }
function countWords(n) {
  if (n === 0) return 'لا أعمال بعد';
  if (n === 1) return 'عمل واحد';
  if (n === 2) return 'عملان';
  return ar(n) + (n <= 10 ? ' أعمال' : ' عملًا');
}
function tint(hex, k) { /* mix a colour with the page white */
  var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, W = [255, 251, 243];
  function m(c, w) { return Math.round(c * (1 - k) + w * k); }
  return 'rgb(' + m(r, W[0]) + ',' + m(g, W[1]) + ',' + m(b, W[2]) + ')';
}

/* ================= ornaments (arabesque) ================= */
function f2(x) { return Math.round(x * 100) / 100; }
function pts(cx, cy, R, r, n, rot) {
  var a = [], k = n * 2, i, t, rad;
  rot = (rot === undefined) ? -Math.PI / 2 : rot;
  for (i = 0; i < k; i++) { rad = (i % 2 === 0) ? R : r; t = rot + Math.PI * i / n; a.push(f2(cx + rad * Math.cos(t)) + ',' + f2(cy + rad * Math.sin(t))); }
  return a.join(' ');
}
function poly(points, attrs) { return '<polygon points="' + points + '" ' + (attrs || '') + '/>'; }
var GOLD = '#C9A24E', GOLD_DK = '#8A6820', GF = 'url(#gGold)';

function tileSVG(stroke, sw) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><g fill="none" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round">';
  [[0, 0], [80, 0], [0, 80], [80, 80], [40, 40]].forEach(function (c) {
    s += poly(pts(c[0], c[1], 27, 13.5, 8)) + '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="5"/>';
  });
  [[40, 0], [0, 40], [80, 40], [40, 80]].forEach(function (c) { s += poly(pts(c[0], c[1], 8, 8, 2, -Math.PI / 2)); });
  return s + '</g></svg>';
}
function bandSVG() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="10" viewBox="0 0 30 10"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3E0A4"/><stop offset=".5" stop-color="#C9A24E"/><stop offset="1" stop-color="#9B7A2C"/></linearGradient></defs>' +
    '<path d="M0 .6H30M0 9.4H30" stroke="#C9A24E" stroke-width=".7" fill="none"/>' +
    '<path d="M15 1.4L19.6 5 15 8.6 10.4 5z" fill="url(#g)"/><path d="M4 5h4M22 5h4" stroke="#C9A24E" stroke-width=".7"/><circle cx="1.2" cy="5" r="1" fill="#C9A24E"/><circle cx="28.8" cy="5" r="1" fill="#C9A24E"/></svg>';
}
function setPatterns() {
  var st = document.documentElement.style;
  function uri(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
  st.setProperty('--pat-star', uri(tileSVG('rgba(43,47,76,.11)', 0.8)));
  st.setProperty('--pat-star-gold', uri(tileSVG('rgba(224,190,100,.6)', 0.7)));
  st.setProperty('--band', uri(bandSVG()));
}
function sealSVG(label) {
  var inner = label
    ? '<text x="50" y="50" dy=".36em" text-anchor="middle" font-family="Reem Kufi,IBM Plex Sans Arabic,sans-serif" font-weight="600" font-size="' + (String(label).length > 2 ? 22 : 32) + '" fill="#F6E2A4">' + label + '</text>'
    : poly(pts(50, 50, 17, 8, 8), 'fill="#F6E2A4"');
  return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    poly(pts(50, 50, 49, 42, 16), 'fill="' + GF + '" stroke="' + GOLD_DK + '" stroke-width=".5"') +
    '<circle cx="50" cy="50" r="34" fill="#2B2F4C"/><circle cx="50" cy="50" r="31" fill="none" stroke="#F0DA9B" stroke-width=".7"/>' +
    poly(pts(50, 50, 28, 19, 8), 'fill="none" stroke="#F0DA9B" stroke-width=".45" opacity=".55"') + inner + '</svg>';
}
function dividerSVG() {
  return '<svg class="orn" viewBox="0 0 300 26" aria-hidden="true" focusable="false">' +
    '<path d="M14 13H116M184 13H286" stroke="' + GOLD + '" stroke-width="1" fill="none"/>' +
    '<path d="M2 13l6-4 6 4-6 4zM286 13l6-4 6 4-6 4zM122 13l5-3.5 5 3.5-5 3.5zM168 13l5-3.5 5 3.5-5 3.5z" fill="' + GF + '"/>' +
    poly(pts(150, 13, 12, 6, 8), 'fill="' + GF + '" stroke="' + GOLD_DK + '" stroke-width=".4"') + '<circle cx="150" cy="13" r="3" fill="#FFFBF3"/></svg>';
}
function ornEl() { var d = document.createElement('div'); d.innerHTML = dividerSVG(); return d.firstChild; }
function miniStar(sz) { return '<svg viewBox="-6 -6 12 12" aria-hidden="true" focusable="false">' + poly(pts(0, 0, 5.5, 2.8, 8), 'fill="' + GF + '"') + '</svg>'; }
function frameSVG() {
  var s = '<svg viewBox="0 0 93.6 125.6" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<rect x=".4" y=".4" width="92.8" height="124.8" fill="none" stroke="' + GOLD + '" stroke-width=".5"/>' +
    '<rect x="2.2" y="2.2" width="89.2" height="121.2" fill="none" stroke="#2B2F4C" stroke-opacity=".3" stroke-width=".25"/>';
  [[0.4, 0.4], [93.2, 0.4], [0.4, 125.2], [93.2, 125.2]].forEach(function (c) { s += poly(pts(c[0], c[1], 3.1, 1.6, 8), 'fill="' + GF + '" stroke="' + GOLD_DK + '" stroke-width=".15"'); });
  [[46.8, 0.4], [46.8, 125.2], [0.4, 62.8], [93.2, 62.8]].forEach(function (c) { s += poly(pts(c[0], c[1], 1.7, 1.7, 2, -Math.PI / 2), 'fill="' + GF + '"'); });
  return s + '</svg>';
}
function rosetteSVG() {
  return '<svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
    '<circle r="48.5" fill="none" stroke="' + GOLD + '" stroke-width=".6"/>' +
    poly(pts(0, 0, 46, 38, 16), 'fill="none" stroke="' + GOLD + '" stroke-width=".7"') +
    poly(pts(0, 0, 38, 28, 16, -Math.PI / 2 + Math.PI / 16), 'fill="' + GF + '" fill-opacity=".2" stroke="#B8903A" stroke-width=".5"') +
    poly(pts(0, 0, 30, 17, 8), 'fill="#2B2F4C" fill-opacity=".93"') +
    poly(pts(0, 0, 26, 15, 8, -Math.PI / 2 + Math.PI / 8), 'fill="none" stroke="#F0DA9B" stroke-width=".5"') +
    '<circle r="10" fill="' + GF + '"/><circle r="6.5" fill="#2B2F4C"/>' + poly(pts(0, 0, 5, 2.4, 8), 'fill="#F6E2A4"') + '</svg>';
}
function coverToolSVG() {
  var s = '<svg viewBox="0 0 100 132" aria-hidden="true" focusable="false"><g fill="none" stroke="' + GF + '">' +
    '<rect x="4" y="4" width="92" height="124" stroke-width=".8"/><rect x="6.6" y="6.6" width="86.8" height="118.8" stroke-width=".3"/>' +
    '<circle cx="50" cy="54" r="38.5" stroke-width=".55"/><circle cx="50" cy="54" r="36.5" stroke-width=".25"/>' +
    poly(pts(50, 54, 35.5, 30, 16), 'stroke-width=".4"') +
    poly(pts(50, 54, 30, 17, 8, -Math.PI / 2 + Math.PI / 8), 'stroke-width=".25" stroke-opacity=".7"') + '</g>';
  [[11, 11], [89, 11], [11, 121], [89, 121]].forEach(function (c) { s += poly(pts(c[0], c[1], 5.4, 2.7, 8), 'fill="' + GF + '"') + '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="1.3" fill="#2B2F4C"/>'; });
  s += '<g fill="' + GF + '">' + poly(pts(50, 4, 2.6, 2.6, 2, -Math.PI / 2)) + poly(pts(50, 128, 2.6, 2.6, 2, -Math.PI / 2)) + poly(pts(4, 66, 2.6, 2.6, 2, -Math.PI / 2)) + poly(pts(96, 66, 2.6, 2.6, 2, -Math.PI / 2)) + '</g>';
  s += '<g stroke="' + GOLD + '" stroke-width=".4" fill="none"><path d="M24 107H44M56 107H76"/></g>' + poly(pts(50, 107, 4.2, 2.1, 8), 'fill="' + GF + '"');
  return s + '</svg>';
}
function ringSVG() {
  var g = '', k;
  for (k = 0; k < 8; k++) g += '<g transform="rotate(' + (k * 45 + 22.5) + ') translate(0,-183.5)">' + poly(pts(0, 0, 7, 3.4, 8), 'fill="' + GF + '"') + '</g>';
  return '<svg viewBox="-200 -200 400 400" aria-hidden="true" focusable="false">' +
    '<circle r="197" fill="none" stroke="' + GOLD + '" stroke-width=".9"/><circle r="190" fill="none" stroke="' + GOLD + '" stroke-width=".4" stroke-opacity=".7"/>' +
    poly(pts(0, 0, 177, 160, 24), 'fill="none" stroke="' + GOLD + '" stroke-width=".5" stroke-opacity=".7"') +
    poly(pts(0, 0, 150, 138, 16, -Math.PI / 2 + Math.PI / 16), 'fill="none" stroke="' + GOLD + '" stroke-width=".45" stroke-opacity=".55"') + g + '</svg>';
}
function archFrameSVG() {
  var A = 'M3,474 L3,191 C3,86 107,38 179,3 C251,38 355,86 355,191 L355,474 Z';
  var B = 'M-4,481 L-4,189 C-4,80 106,30 179,-4 C252,30 362,80 362,189 L362,481 Z';
  return '<svg viewBox="0 0 358 477" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path d="' + A + '" fill="none" stroke="' + GF + '" stroke-width="2.6" vector-effect="non-scaling-stroke"/>' +
    '<path d="' + B + '" fill="none" stroke="' + GOLD + '" stroke-width="1" stroke-opacity=".8" vector-effect="non-scaling-stroke"/></svg>';
}

/* ================= sound ================= */
var sound = (function () {
  var srcs = D.sound || [], pool = [], rot = 0, on = lsGet('co_sound') !== '0';
  function make() { return srcs.map(function (s) { var a = new Audio(); a.preload = 'auto'; a.src = s; return a; }); }
  function init() { if (!pool.length && srcs.length) { pool = [make(), make()]; } }
  function one() {
    if (!on || !srcs.length) return; init();
    var k = rot++ % srcs.length, a = null, i;
    for (i = 0; i < pool.length; i++) { var c = pool[i][k]; if (c.paused || c.ended) { a = c; break; } }
    if (!a) a = pool[0][k].cloneNode();
    try { a.currentTime = 0; a.volume = 0.85; var p = a.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { /* ignore */ }
  }
  return {
    turn: function (n) { for (var k = 0; k < Math.min(n, 4); k++) (function (d) { if (d) setTimeout(one, d); else one(); })(k * 120); },
    get on() { return on; },
    set: function (v) { on = v; lsSet('co_sound', v ? '1' : '0'); if (v) init(); }
  };
})();

/* ================= toast ================= */
var toastEl = $('#toast'), toastT = null;
function toast(msg, actLabel, act) {
  toastEl.textContent = ''; toastEl.appendChild(h('span', { text: msg }));
  if (actLabel) toastEl.appendChild(h('button', { type: 'button', text: actLabel, on: { click: function () { act(); hideToast(); } } }));
  toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(hideToast, 7000);
}
function hideToast() { toastEl.hidden = true; }

/* ================= lightbox ================= */
var lb = $('#lb'), lbimg = $('#lbimg'), lbcap = $('#lbcap'), lbmeta = $('#lbmeta');
var lbList = [], lbIdx = 0, lbOpener = null, lbTitle = '';
function lbShow() {
  var w = lbList[lbIdx];
  lbimg.src = w.full; lbimg.alt = (w.cap || 'عمل') + '، ' + lbTitle;
  lbcap.textContent = w.cap || ''; lbcap.hidden = !w.cap;
  lbmeta.textContent = lbTitle + ' · ' + ar(lbIdx + 1) + ' من ' + ar(lbList.length);
}
function lbStep(d) { if (!lbList.length) return; lbIdx = (lbIdx + d + lbList.length) % lbList.length; lbShow(); }
function openLb(list, idx, title, opener) {
  if (!list.length) return;
  lbList = list; lbIdx = clamp(idx, 0, list.length - 1); lbTitle = title; lbOpener = opener || null;
  lbShow(); if (!lb.open) lb.showModal();
}
$('#lbclose').addEventListener('click', function () { lb.close(); });
$('#lbprev').addEventListener('click', function () { lbStep(-1); });
$('#lbnext').addEventListener('click', function () { lbStep(1); });
lb.addEventListener('click', function (e) { if (e.target === lb || e.target.id === 'lbin') lb.close(); });
lb.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight') { lbStep(-1); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { lbStep(1); e.preventDefault(); }
});
lb.addEventListener('close', function () { if (lbOpener && document.contains(lbOpener) && !lbOpener.closest('[inert]')) lbOpener.focus(); });
(function () {
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 60) lbStep(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

/* ================= the book: pages ================= */
var B = { pages: [], leaves: [], mode: 'double', pos: 0, n: 0, chStart: [], chEnd: [], animUntil: 0, settleT: {} };

function pageCover() {
  var words = BOOK_TITLE.split(/\s+/).filter(Boolean);
  return {
    cls: 'cover', ch: -1, kind: 'cover',
    build: function () {
      var lines = words.length === 2 ? words : [BOOK_TITLE];
      return [
        ico(coverToolSVG(), 'tool'),
        h('div', { class: 'ttx' }, [
          h('div', { class: 't1 display' }, lines.map(function (w) { return h('span', { class: 'goldtext', text: w, style: 'display:block' }); })),
          h('div', { class: 't2 callig goldtext', text: 'كلود عبيد' })
        ]),
        h('div', { class: 'sub', text: 'لوحات وحكايات من مراحل العمر' }),
        h('div', { class: 'opencue', text: 'اضغط على الزاوية أو اسحب لتقليب الصفحة' })
      ];
    }
  };
}
function pageBack() {
  return { cls: 'cover', ch: -1, kind: 'back', build: function () { return [ico(coverToolSVG(), 'tool'), h('div', { class: 'ttx' }, [ico(sealSVG(''), 'seal', 'div')])]; } };
}
function cartSVG() {
  return '<svg viewBox="0 0 60 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path d="M2,78 L2,34 C2,18 20,8 30,2 C40,8 58,18 58,34 L58,78 Z" fill="#FFFBF3" fill-opacity=".94" stroke="' + GOLD + '" stroke-width=".7" vector-effect="non-scaling-stroke"/>' +
    '<path d="M5,75 L5,35 C5,21 21,11.5 30,6.2 C39,11.5 55,21 55,35 L55,75 Z" fill="none" stroke="' + GOLD + '" stroke-width=".35" vector-effect="non-scaling-stroke"/>' +
    poly(pts(30, 2, 2.6, 1.3, 8), 'fill="' + GF + '"') + poly(pts(30, 78, 2.6, 1.3, 8), 'fill="' + GF + '"') + '</svg>';
}
function pageEndpaper() {
  return {
    cls: 'endpaper', ch: -1, kind: 'endpaper',
    build: function () {
      return [h('div', { class: 'cart' }, [h('div', { class: 'cbox' }, [ico(cartSVG(), 'cbg'), h('div', { class: 'cin' }, [h('div', { class: 'callig', text: 'كلود عبيد' }), ornEl(), h('small', { text: 'لوحاتٌ وحكايات' })])])])];
    }
  };
}
function pageTOC(slice, startIx, part, parts) {
  return {
    cls: 'tocpg', ch: -1, kind: 'toc',
    build: function () {
      var ul = h('ul', { class: 'tocl' });
      slice.forEach(function (c, k) {
        var ci = startIx + k;
        ul.appendChild(h('li', {}, [h('button', { type: 'button', 'data-ch': String(ci), on: { click: function () { goChapter(ci); } } }, [
          ico(sealSVG(ar(ci + 1)), 'n', 'span'),
          h('span', { class: 'nm', text: c.title }),
          h('span', { class: 'dots', 'aria-hidden': 'true' }),
          h('span', { class: 'ct', text: countWords(c.works.length) })
        ])]));
      });
      if (!slice.length) ul.appendChild(h('li', { class: 'ct', text: 'ستُضاف المراحل هنا.' }));
      return [ico(frameSVG(), 'pframe'), h('div', { class: 'pgwrap' }, [
        h('h3', { class: 'display', text: parts > 1 ? 'الفهرس ' + ar(part) : 'الفهرس' }),
        ornEl(), ul
      ])];
    }
  };
}
function pageFill(k) {
  return {
    cls: 'fillpg', ch: -1, kind: 'fill',
    build: function () {
      return [ico(frameSVG(), 'pframe'), h('div', { class: 'pgwrap' }, [ico(rosetteSVG(), 'big'), h('div', { class: 'callig', text: PHRASES[k % PHRASES.length] })])];
    }
  };
}
function pageEnd() {
  return {
    cls: 'endpg', ch: -1, kind: 'end',
    build: function () {
      return [ico(frameSVG(), 'pframe'), h('div', { class: 'pgwrap' }, [
        h('div', { class: 'callig', text: 'وللحكاية بقية' }), ornEl(),
        h('p', { text: 'شكرًا لأنك قلبت صفحات هذه الحكاية.' }),
        h('button', { type: 'button', class: 'btn2', text: 'العودة إلى الفهرس', on: { click: function () { turn(pageToPos(2)); } } })
      ])];
    }
  };
}
function pageTitle(ci) {
  var c = CH[ci];
  return {
    cls: 'titlepg', ch: ci, kind: 'title', style: { '--tint': tint(c.bg, 0.45) },
    build: function () {
      var first = (c.title.split(/\s+/)[0] || c.title), fs = Math.min(42, 250 / Math.max(first.length, 1));
      var kids = [
        h('div', { class: 'wm', 'aria-hidden': 'true', text: first, style: 'font-size:' + f2(fs) + 'cqw' }),
        ico(sealSVG(ar(ci + 1)), 'seal'),
        h('h3', { class: 'display', text: c.title }),
        h('div', { class: 'yrs', text: c.years || ordinal(ci) }),
        ornEl()
      ];
      if (c.intro) kids.push(h('p', { class: 'txt', text: c.intro }));
      kids.push(h('div', { class: 'count', text: countWords(c.works.length) }));
      return [ico(frameSVG(), 'pframe'), h('div', { class: 'pgwrap' }, kids)];
    }
  };
}
function asp(w) { return w.w / Math.max(1, w.h); }
function workPages(ci) {
  var c = CH[ci], ws = c.works, out = [], i = 0, r, k, grp, layout, a, b;
  if (!ws.length) {
    return [{
      cls: 'paint', ch: ci, kind: 'empty', style: { '--tint': tint(c.bg, 0.55) },
      build: function () { return [ico(frameSVG(), 'pframe'), h('div', { class: 'pgwrap' }, [h('div', { class: 'emptypg', text: PREVIEW ? 'لم تُضف لوحات إلى هذه المرحلة بعد. استخدمي «أضيفي صورًا» في الشريط السفلي.' : 'ستُضاف لوحات هذه المرحلة قريبًا.' })])]; }
    }];
  }
  while (i < ws.length) {
    r = ws.length - i;
    if (r === 1) k = 1;
    else if (r === 3) k = 3;
    else if (r === 4 && ws.slice(i, i + 4).every(function (w) { return w.photo; })) k = 4;
    else k = (r - 2 === 1) ? 3 : 2;
    grp = ws.slice(i, i + k);
    if (k === 1) layout = 'g1';
    else if (k === 3) layout = 'g3';
    else if (k === 4) layout = 'g4';
    else { a = asp(grp[0]); b = asp(grp[1]); layout = ((a + b) / 2 >= 1.0) ? 'g2' : 'g2h'; }
    out.push({ ws: grp, from: i, layout: layout });
    i += k;
  }
  return out.map(function (p) {
    return {
      cls: 'paint', ch: ci, kind: 'paint', from: p.from, count: p.ws.length, style: { '--tint': tint(c.bg, 0.55) },
      build: function (el, idx) {
        var cells = p.ws.map(function (w, j) {
          var wi = p.from + j;
          var img = h('img', { 'data-src': w.thumb, alt: '', width: String(w.w), height: String(w.h), decoding: 'async' });
          return h('button', { type: 'button', class: 'pw' + (w.photo ? ' photo' : ''), 'aria-label': (w.cap || 'عمل') + '، ' + c.title + '. تكبير الصورة', on: { click: function (e) { openLb(c.works, wi, c.title, e.currentTarget); } } }, [img]);
        });
        return [
          ico(frameSVG(), 'pframe'),
          h('div', { class: 'pgwrap' }, [
            h('div', { class: 'runhead' }, [ico(miniStar(), '', 'span'), h('span', { text: c.title }), ico(miniStar(), '', 'span')]),
            h('div', { class: 'pgrid ' + p.layout }, cells)
          ]),
          h('div', { class: 'pagenum', 'aria-hidden': 'true' }, [h('span', { text: ar(idx) })])
        ];
      }
    };
  });
}
function makePages() {
  var P = [], i, k = 0, per = 8, nT, t;
  P.push(pageCover()); P.push(pageEndpaper());
  nT = Math.max(1, Math.ceil(CH.length / per));
  for (t = 0; t < nT; t++) P.push(pageTOC(CH.slice(t * per, (t + 1) * per), t * per, t + 1, nT));
  B.chStart = []; B.chEnd = [];
  if (P.length % 2 === 0) P.push(pageFill(k++));
  for (i = 0; i < CH.length; i++) {
    B.chStart[i] = P.length;
    P.push(pageTitle(i));
    workPages(i).forEach(function (p) { P.push(p); });
    B.chEnd[i] = P.length - 1;
    if (P.length % 2 !== (i < CH.length - 1 ? 1 : 0)) P.push(pageFill(k++));
  }
  if (!CH.length && P.length % 2 !== 0) P.push(pageFill(k++));
  P.push(pageEnd());
  P.push(pageBack());
  return P;
}

/* ================= the book: DOM ================= */
function faceEl(desc, side, idx) {
  var el = h('div', { class: 'face ' + side + ' ' + desc.cls, 'data-p': String(idx) });
  if (desc.style) Object.keys(desc.style).forEach(function (k) { el.style.setProperty(k, desc.style[k]); });
  desc.build(el, idx).forEach(function (n) { el.appendChild(n); });
  el.appendChild(h('div', { class: 'shade' }));
  return el;
}
function buildBook() {
  B.pages = makePages();
  var b3d = $('#b3d'), single = B.mode === 'single', N = single ? B.pages.length : B.pages.length / 2, i, lf;
  b3d.textContent = ''; B.leaves = []; B.n = N;
  for (i = 0; i < N; i++) {
    lf = h('div', { class: 'leaf' });
    lf.style.zIndex = String(N - i);
    if (single) lf.appendChild(faceEl(B.pages[i], 'front', i));
    else { lf.appendChild(faceEl(B.pages[2 * i], 'front', 2 * i)); lf.appendChild(faceEl(B.pages[2 * i + 1], 'back', 2 * i + 1)); }
    b3d.appendChild(lf); B.leaves.push(lf);
  }
  $('#stage').classList.toggle('single', single);
  $('#sw').classList.toggle('single', single);
}
function maxPos() { return B.mode === 'single' ? B.n - 1 : B.n; }
function visiblePages() {
  var p = B.pos;
  if (B.mode === 'single') return [p];
  if (p === 0) return [0];
  if (p === B.n) return [2 * B.n - 1];
  return [2 * p - 1, 2 * p];
}
function pageToPos(p) { return B.mode === 'single' ? clamp(p, 0, B.n - 1) : (p <= 0 ? 0 : Math.min(B.n, Math.ceil(p / 2))); }
function posToPage() {
  if (B.mode === 'single') return B.pos;
  if (B.pos === 0) return 0;
  if (B.pos >= B.n) return 2 * B.n - 1;
  return 2 * B.pos - 1;
}
function chapterAt() {
  var vp = visiblePages(), i, c = -1;
  for (i = 0; i < vp.length; i++) { var d = B.pages[vp[i]]; if (d && d.ch >= 0) { c = d.ch; break; } }
  return c;
}
function showNear(pos) { B.leaves.forEach(function (lf, i) { if (Math.abs(i - pos) <= 2) lf.style.visibility = 'visible'; }); }
function cull() {
  if (Date.now() < B.animUntil) return;
  B.leaves.forEach(function (lf, i) { lf.style.visibility = Math.abs(i - B.pos) <= 2 ? 'visible' : 'hidden'; });
}
function loadNear() {
  var vp = visiblePages(), lo = Math.min.apply(null, vp) - (B.mode === 'single' ? 3 : 4), hi = Math.max.apply(null, vp) + (B.mode === 'single' ? 4 : 5);
  $$('.face', $('#b3d')).forEach(function (fe) {
    var p = +fe.getAttribute('data-p'); if (p < lo || p > hi) return;
    $$('img[data-src]', fe).forEach(function (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); });
  });
}
function setFlippedInstant(count) {
  var b3d = $('#b3d'); b3d.classList.add('nt');
  B.leaves.forEach(function (lf, i) { lf.classList.toggle('flipped', i < count); lf.style.zIndex = String(i < count ? i + 1 : B.n - i); });
  void b3d.offsetWidth; b3d.classList.remove('nt');
}
function updateUI() {
  var st = $('#stage'), vp = visiblePages(), max = maxPos(), single = B.mode === 'single';
  st.classList.toggle('at-start', !single && B.pos === 0);
  st.classList.toggle('at-end', !single && B.pos === B.n);
  $$('.face', $('#b3d')).forEach(function (fe) {
    var vis = vp.indexOf(+fe.getAttribute('data-p')) !== -1;
    fe.inert = !vis; fe.setAttribute('aria-hidden', vis ? 'false' : 'true');
  });
  ['#navPrev', '#mobPrev', '#cornPrev'].forEach(function (s) { $(s).disabled = B.pos <= 0; });
  ['#navNext', '#mobNext', '#cornNext'].forEach(function (s) { $(s).disabled = B.pos >= max; });
  var ci = chapterAt(), d = B.pages[vp[0]], text;
  if (ci >= 0) text = '«' + CH[ci].title + '» · ' + ordinal(ci);
  else if (d.kind === 'cover') text = 'غلاف ' + BOOK_TITLE;
  else if (d.kind === 'back') text = 'نهاية الكتاب';
  else if (d.kind === 'end') text = 'نهاية الكتاب';
  else if (d.kind === 'toc' || d.kind === 'endpaper') text = 'الفهرس';
  else text = BOOK_TITLE;
  $('#crumb').textContent = text;
  $$('.chip', $('#chips')).forEach(function (c, i) {
    if (i === ci) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
  });
  if (ci >= 0) document.documentElement.style.setProperty('--act', CH[ci].deep);
  var cur = ci >= 0 ? $$('.chip', $('#chips'))[ci] : null;
  if (cur) {
    var box = $('#chips'), cr = box.getBoundingClientRect(), r = cur.getBoundingClientRect();
    box.scrollTo({ left: box.scrollLeft + (r.left + r.width / 2) - (cr.left + cr.width / 2), behavior: reduced ? 'auto' : 'smooth' });
  }
  loadNear();
}
function turn(target) {
  target = clamp(target, 0, maxPos());
  var from = B.pos, i, idxs = [], fwd;
  if (target === from) return;
  fwd = target > from;
  if (fwd) for (i = from; i < target; i++) idxs.push(i);
  else for (i = from - 1; i >= target; i--) idxs.push(i);
  B.pos = target;
  var n = idxs.length, step = reduced ? 0 : Math.min(90, 700 / Math.max(1, n - 1)), dur = reduced ? 30 : 1050;
  idxs.forEach(function (li) { B.leaves[li].style.visibility = 'visible'; });
  showNear(target);
  B.animUntil = Math.max(B.animUntil, Date.now() + (n - 1) * step + dur + 80);
  loadNear();
  sound.turn(n);
  idxs.forEach(function (li, k) {
    var lf = B.leaves[li];
    function run() {
      lf.style.zIndex = String(B.n + 10 + k);
      lf.classList.toggle('flipped', fwd);
      clearTimeout(B.settleT[li]);
      B.settleT[li] = setTimeout(function () {
        lf.style.zIndex = String(lf.classList.contains('flipped') ? li + 1 : B.n - li);
        cull();
      }, dur);
    }
    if (k === 0 || !step) run(); else setTimeout(run, k * step);
  });
  updateUI();
}
function goChapter(ci) {
  if (!B.chStart[ci] && B.chStart[ci] !== 0) return;
  turn(pageToPos(B.chStart[ci]));
}
function applyPos(pos) {
  B.pos = clamp(pos, 0, maxPos());
  setFlippedInstant(B.pos); B.animUntil = 0; cull(); updateUI();
}

/* chips (period buttons) */
function renderChips() {
  var box = $('#chips'); box.textContent = '';
  CH.forEach(function (c, i) {
    box.appendChild(h('button', { type: 'button', class: 'chip', on: { click: function () { goChapter(i); } } }, [h('b', { text: ar(i + 1) }), h('span', { text: c.title })]));
  });
}

/* controls */
function bindBook() {
  var stage = $('#stage');
  $('#navNext').addEventListener('click', function () { turn(B.pos + 1); });
  $('#navPrev').addEventListener('click', function () { turn(B.pos - 1); });
  $('#mobNext').addEventListener('click', function () { turn(B.pos + 1); });
  $('#mobPrev').addEventListener('click', function () { turn(B.pos - 1); });
  $('#cornNext').addEventListener('click', function () { turn(B.pos + 1); });
  $('#cornPrev').addEventListener('click', function () { turn(B.pos - 1); });
  var snd = $('#snd');
  snd.setAttribute('aria-pressed', sound.on ? 'true' : 'false');
  snd.addEventListener('click', function () { var v = !sound.on; sound.set(v); snd.setAttribute('aria-pressed', v ? 'true' : 'false'); if (v) sound.turn(1); });

  /* swipe: dragging towards the right moves forward in an Arabic book */
  var sx = null, sy = null, st = 0, swiped = false;
  stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; sx = e.clientX; sy = e.clientY; st = Date.now(); swiped = false; });
  stage.addEventListener('pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - st < 900) { swiped = true; setTimeout(function () { swiped = false; }, 400); turn(B.pos + (dx > 0 ? 1 : -1)); }
  });
  stage.addEventListener('pointercancel', function () { sx = null; });
  stage.addEventListener('click', function (e) { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);

  /* keyboard: in Arabic, the left arrow is "next" */
  var inView = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(stage);
  document.addEventListener('keydown', function (e) {
    if (!inView || lb.open || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ($('#bookView').hidden) return;
    if (e.key === 'ArrowLeft') { turn(B.pos + 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { turn(B.pos - 1); e.preventDefault(); }
  });

  /* switch between one page and two pages */
  var mq = window.matchMedia('(max-width: 820px)');
  function onMq() {
    var want = mq.matches ? 'single' : 'double';
    if (want === B.mode) return;
    var page = posToPage(); B.mode = want; buildBook(); applyPos(pageToPos(page));
  }
  if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  B.mode = mq.matches ? 'single' : 'double';
}
function rebuildKeep(goToPage) {
  var page = (goToPage === undefined) ? posToPage() : goToPage;
  buildBook(); renderChips(); applyPos(pageToPos(page)); buildAll(true); buildSearchIndex();
}

/* ================= all works (grid view) ================= */
var allBuilt = false;
function buildAll(force) {
  var root = $('#allView');
  if (!force && allBuilt) return;
  if (!$('#allView').hidden || force) { /* build now */ } else { allBuilt = false; return; }
  root.textContent = '';
  CH.forEach(function (c, ci) {
    var gal = h('div', { class: 'gal' });
    c.works.forEach(function (w, wi) {
      var fig = h('figure', { class: 'wk' + (w.photo ? ' photo' : '') }, [
        h('button', { type: 'button', class: 'wkb', 'aria-label': (w.cap || 'عمل') + '، ' + c.title + '. تكبير الصورة', on: { click: function (e) { openLb(c.works, wi, c.title, e.currentTarget); } } }, [
          h('img', { src: w.thumb, alt: '', width: String(w.w), height: String(w.h), loading: 'lazy', decoding: 'async' })
        ]),
        w.cap ? h('figcaption', { text: w.cap }) : null
      ]);
      if (HOOKS.work) HOOKS.work(fig, ci, wi, w);
      gal.appendChild(fig);
    });
    var sec = h('section', { class: 'ch', style: '--bg:' + tint(c.bg, 0.25), 'aria-label': c.title }, [
      h('div', { class: 'chead' }, [ico(sealSVG(ar(ci + 1)), 'seal'), h('div', { class: 'ttl' }, [h('h2', { class: 'display', text: c.title }), c.intro ? h('p', { class: 'intro story', text: c.intro }) : null, h('p', { class: 'hint', text: countWords(c.works.length) })])]),
      gal
    ]);
    root.appendChild(sec);
  });
  allBuilt = true;
}
function showView(v) {
  var all = v === 'all';
  $('#bookView').hidden = all; $('#allView').hidden = !all;
  $('#tabBook').setAttribute('aria-pressed', all ? 'false' : 'true');
  $('#tabAll').setAttribute('aria-pressed', all ? 'true' : 'false');
  if (all) buildAll(true);
}

/* ================= words, about, footer ================= */
function bookEl(b) {
  var inner = [];
  if (b.badge) inner.push(h('span', { class: 'badge', text: b.badge }));
  inner.push(h('h4', { text: b.title }));
  if (b.sub) inner.push(h('div', { class: 'm', text: b.sub }));
  if (b.note) inner.push(h('p', { text: b.note }));
  if (b.url) inner.push(h('a', { class: 'lnk', href: b.url, target: '_blank', rel: 'noopener', text: b.link || 'فتح الرابط' }));
  var small = !b.cover && !b.badge && !b.note && !b.url;
  var kids = [];
  if (b.cover) kids.push(h('img', { class: 'cv', src: b.cover, alt: 'غلاف كتاب ' + b.title, loading: 'lazy' }));
  else if (!small) kids.push(h('div', { class: 'ph', 'aria-hidden': 'true' }, [h('span', { text: 'كلود عبيد' }), h('b', { text: b.title }), h('span', { text: '' })]));
  kids.push(h('div', { class: 'in' }, inner));
  return h('article', { class: 'bk rv' + (small ? ' small' : '') }, small ? inner : kids);
}
function articleEl(a) {
  var kids = [a.tag ? h('span', { class: 't', text: a.tag }) : null, h('span', { class: 'h', text: a.title }), a.note ? h('span', { class: 'm', text: a.note }) : null];
  if (a.url) return h('a', { class: 'ai rv', href: a.url, target: '_blank', rel: 'noopener' }, kids);
  return h('div', { class: 'ai rv' }, kids);
}
function videoEl(v) {
  var th = h('div', { class: 'th' }, [svgUse('play'), h('span', { class: 'pg', text: v.prog || 'فيديو' }), v.dur ? h('span', { class: 'du', text: v.dur }) : null]);
  var kids = [th, h('div', { class: 'h', text: v.title }), v.note ? h('div', { class: 'm', text: v.note }) : null];
  if (v.url) return h('a', { class: 'vd rv', href: v.url, target: '_blank', rel: 'noopener' }, kids);
  return h('div', { class: 'vd rv' }, kids);
}
function renderWords() {
  var root = $('#words'); root.textContent = '';
  var ed = editing();
  var any = D.books.length + D.articles.length + D.videos.length;
  if (!any && !ed) { root.hidden = true; return; }
  root.hidden = false;
  var wrap = h('div', { class: 'wrap' });
  wrap.appendChild(h('header', { class: 'chead rv' }, [
    ico(sealSVG(''), 'seal'),
    h('div', { class: 'ttl' }, [h('h2', { class: 'display', text: 'كلماتها' }), h('p', { class: 'intro story', text: 'لوحاتها تتكلم، وهي أيضًا تكتب: كتب ومقالات ومقابلات.' })])
  ]));
  var mark = function (kind) { return function (b, i) { var e = (kind === 'book' ? bookEl : kind === 'article' ? articleEl : videoEl)(b); e.setAttribute('data-k', kind); e.setAttribute('data-i', String(i)); return e; }; };
  if (D.books.length || ed) { wrap.appendChild(h('h3', { class: 'display sub', text: 'كتب' })); wrap.appendChild(h('div', { class: 'shelf', id: 'shelf' }, D.books.map(mark('book')))); }
  var cols = h('div', { class: 'cols' });
  if (D.articles.length || ed) cols.appendChild(h('div', { class: 'col', id: 'articles' }, [h('h3', { class: 'display sub', text: 'مقالات' })].concat(D.articles.map(mark('article')))));
  if (D.videos.length || ed) cols.appendChild(h('div', { class: 'col', id: 'videos' }, [h('h3', { class: 'display sub', text: 'مرئيات' }), h('div', { class: 'vids' }, D.videos.map(mark('video')))]));
  wrap.appendChild(cols);
  root.appendChild(wrap);
  if (HOOKS.words) HOOKS.words(root);
}
function linkItems() {
  var out = [];
  if (SITE.contact_email) out.push(h('a', { href: 'mailto:' + SITE.contact_email, text: 'البريد الإلكتروني' }));
  if (SITE.instagram) out.push(h('a', { href: SITE.instagram, target: '_blank', rel: 'noopener', text: 'إنستغرام' }));
  if (SITE.facebook) out.push(h('a', { href: SITE.facebook, target: '_blank', rel: 'noopener', text: 'فيسبوك' }));
  if (SITE.youtube) out.push(h('a', { href: SITE.youtube, target: '_blank', rel: 'noopener', text: 'يوتيوب' }));
  return out;
}
function renderAbout() {
  var al = $('#album'); al.textContent = '';
  (D.album || []).forEach(function (a) {
    al.appendChild(h('figure', {}, [h('img', { src: a.thumb, alt: 'صورة من ألبوم كلود عبيد', width: String(a.w), height: String(a.h), loading: 'lazy' })]));
  });
  al.hidden = !(D.album || []).length && !(PREVIEW && document.body.classList.contains('edit'));
  var tx = $('#aboutTx'); tx.textContent = '';
  tx.appendChild(h('h2', { class: 'display', id: 'aboutTitle', text: SITE.about_title || 'عنها' }));
  tx.appendChild(ico(dividerSVG(), '', 'div'));
  var body = h('div', { class: 'abody', id: 'aboutBody' });
  String(SITE.about_text || '').split(/\n+/).forEach(function (par) { if (par.trim()) body.appendChild(h('p', { class: 'story', text: par.trim() })); });
  tx.appendChild(body);
  var links = linkItems();
  if (links.length) tx.appendChild(h('div', { class: 'links' }, links));
  if (HOOKS.about) HOOKS.about();
}
function renderFooter() {
  var f = $('#foot'); f.textContent = '';
  var year = ar(new Date().getFullYear());
  if (PREVIEW && !linkItems().length) { f.appendChild(document.createTextNode('للتواصل: البريد الإلكتروني وحسابات التواصل تُضاف بعد موافقتها.')); f.appendChild(h('br')); }
  else if (linkItems().length) {
    linkItems().forEach(function (a, i) { if (i) f.appendChild(document.createTextNode(' · ')); a.className = 'flink'; f.appendChild(a); });
    f.appendChild(h('br'));
  }
  f.appendChild(document.createTextNode('© ' + year + ' كلود عبيد. جميع حقوق اللوحات والنصوص محفوظة.'));
}

/* ================= search ================= */
var SI = [];
function buildSearchIndex() {
  SI = [];
  CH.forEach(function (c, ci) {
    SI.push({ t: 'p', ci: ci, label: c.title, sub: (c.years || ordinal(ci)), text: c.title + ' ' + (c.intro || '') + ' ' + (c.years || '') + ' ' + ordinal(ci) });
    c.works.forEach(function (w, wi) { if (w.cap) SI.push({ t: 'w', ci: ci, wi: wi, label: w.cap, sub: c.title, text: w.cap + ' ' + c.title }); });
  });
  D.books.forEach(function (b) { SI.push({ t: 'b', label: b.title, sub: b.sub, url: b.url, text: b.title + ' ' + b.sub + ' ' + b.note }); });
  D.articles.forEach(function (a) { SI.push({ t: 'a', label: a.title, sub: a.note, url: a.url, text: a.title + ' ' + a.note + ' ' + a.tag }); });
  D.videos.forEach(function (v) { SI.push({ t: 'v', label: v.title, sub: v.prog + ' ' + v.note, url: v.url, text: v.title + ' ' + v.prog + ' ' + v.note }); });
}
var GROUPS = { p: 'المراحل', w: 'الصور', b: 'الكتب', a: 'المقالات', v: 'المرئيات' };
function closeSearch() { var r = $('#sres'); r.hidden = true; r.textContent = ''; $('#q').setAttribute('aria-expanded', 'false'); }
function runSearch() {
  var q = norm($('#q').value), box = $('#sres');
  if (!q) { closeSearch(); return; }
  var toks = q.split(' '), res = SI.filter(function (e) { var n = norm(e.text); return toks.every(function (t) { return n.indexOf(t) !== -1; }); });
  box.textContent = '';
  if (!res.length) { box.appendChild(h('div', { class: 'none', text: 'لا نتائج. جرّب كلمة أخرى.' })); }
  else {
    ['p', 'w', 'b', 'a', 'v'].forEach(function (g) {
      var list = res.filter(function (e) { return e.t === g; }).slice(0, 6);
      if (!list.length) return;
      box.appendChild(h('div', { class: 'sg' }, [h('h4', { text: GROUPS[g] })].concat(list.map(function (e) {
        var kids = [h('span', { class: 'l', text: e.label }), e.sub ? h('small', { text: e.sub }) : null];
        if ((g === 'b' || g === 'a' || g === 'v') && e.url) return h('a', { class: 'sr1', href: e.url, target: '_blank', rel: 'noopener' }, kids);
        return h('button', { type: 'button', class: 'sr1', on: { click: function () { pickResult(e); } } }, kids);
      }))));
    });
  }
  box.hidden = false; $('#q').setAttribute('aria-expanded', 'true');
}
function pickResult(e) {
  closeSearch();
  if (e.t === 'p') { showView('book'); $('#book').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); setTimeout(function () { goChapter(e.ci); }, reduced ? 0 : 350); }
  else if (e.t === 'w') openLb(CH[e.ci].works, e.wi, CH[e.ci].title, $('#q'));
  else $('#words').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}
$('#q').addEventListener('input', runSearch);
$('#q').addEventListener('focus', function () { if ($('#q').value) runSearch(); });
$('#sf').addEventListener('submit', function (e) { e.preventDefault(); var b = $('#sres .sr1'); if (b) b.click(); });
document.addEventListener('click', function (e) { if (!e.target.closest('#sf')) closeSearch(); });
$('#sf').addEventListener('keydown', function (e) { if (e.key === 'Escape') { $('#q').value = ''; closeSearch(); } });

/* ================= page chrome: progress, rail, reveal ================= */
function chrome() {
  var bar = $('#prog'), tick = false;
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var d = document.documentElement, max = d.scrollHeight - d.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')'; tick = false;
    });
  }, { passive: true });
  if (!('IntersectionObserver' in window)) return;
  var rail = $('#rail');
  var ior = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      $$('a', rail).forEach(function (a) { a.removeAttribute('aria-current'); });
      var a = rail.querySelector('[data-t="' + e.target.id + '"]'); if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  ['top', 'book', 'words', 'about'].forEach(function (id) { var s = document.getElementById(id); if (s) ior.observe(s); });
  if (!reduced) {
    document.documentElement.classList.add('reveal-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.04, rootMargin: '0px 0px -4% 0px' });
    $$('.rv').forEach(function (el) { io.observe(el); });
  }
}

/*__PREVIEW_JS__*/

/* ================= start ================= */
function init() {
  setPatterns();
  /* hero */
  $('#ringHost').appendChild(ico(ringSVG(), '', 'div'));
  $('#frameHost').appendChild(ico(archFrameSVG(), '', 'div'));
  $('#ornHero').appendChild(ico(dividerSVG(), '', 'div'));
  $('#ornBook').appendChild(ico(dividerSVG(), '', 'div'));
  $('#bkSeal').appendChild(ico(sealSVG(''), '', 'div'));
  $('#tagline').textContent = SITE.tagline || '';
  $('#bkTitle').textContent = BOOK_TITLE;
  $('#goLabel').textContent = 'تصفّح ' + BOOK_TITLE;
  var por = $('#portrait');
  if (D.portrait) { por.src = D.portrait.thumb; por.width = D.portrait.w; por.height = D.portrait.h; }
  else $('#portal').hidden = true;

  /* the book */
  bindBook(); buildBook(); renderChips(); applyPos(0);
  $('#tabBook').addEventListener('click', function () { showView('book'); });
  $('#tabAll').addEventListener('click', function () { showView('all'); });

  renderWords(); renderAbout(); renderFooter(); buildSearchIndex(); chrome();
  if (PREVIEW) initPreview();
}
if (PREVIEW) previewBoot(init); else init();
})();
