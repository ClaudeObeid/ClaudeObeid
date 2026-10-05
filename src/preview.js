/* ================= preview only: the try-it editor =================
   Lets Dr. Obeid try the real thing: add a period, add pictures, add a book / article / video,
   change a period's name and text, type in the "About" text and manage its photos.
   Everything is saved in this browser only (IndexedDB), never on the real website.
   This file is not part of the real site. */
var NEWCOL = [['#E4E8F8', '#B9C4EC'], ['#F8E4EE', '#EBB5CF'], ['#E2F0E4', '#B5D8BC'], ['#FCE8D4', '#F5C79A']];
var EDIT = { on: false }, newCount = 0, STORE_KEY = 'state:' + (D.sig || '0'), saveT = null, dirty = false, saveWarned = false;
var PT = (function () { var d = document.createElement('div'); try { d.contentEditable = 'plaintext-only'; } catch (e) { return 'true'; } return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true'; })();

/* ---- storage: IndexedDB. Every failure is swallowed: the editor then simply works for this visit only ---- */
var idb = (function () {
  var dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      try {
        var r = indexedDB.open('co_preview', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
        r.onblocked = function () { rej(new Error('blocked')); };
      } catch (e) { rej(e); }
    });
    return dbp;
  }
  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction('kv', mode), rq = fn(t.objectStore('kv'));
        t.oncomplete = function () { res(rq ? rq.result : undefined); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  return {
    get: function (k) { return tx('readonly', function (s) { return s.get(k); }); },
    set: function (k, v) { return tx('readwrite', function (s) { return s.put(v, k); }); },
    del: function (k) { return tx('readwrite', function (s) { return s.delete(k); }); }
  };
})();

function applyState(s) {
  if (!s || s.v !== 1) return;
  CH.forEach(function (c) {
    var t = s.chText && s.chText[c.id];
    if (t) { c.title = t.title || c.title; c.intro = t.intro || ''; c.years = t.years || ''; }
    var add = s.chAdded && s.chAdded[c.id];
    if (add) add.forEach(function (w) { c.works.push(w); });
  });
  (s.chNew || []).forEach(function (n) { n.user = true; CH.push(n); });
  newCount = (s.chNew || []).length;
  if (s.books) D.books = s.books;
  if (s.articles) D.articles = s.articles;
  if (s.videos) D.videos = s.videos;
  if (s.about) { if (s.about.title) SITE.about_title = s.about.title; if (typeof s.about.text === 'string') SITE.about_text = s.about.text; }
  if (s.album) D.album = s.album;
}
function previewBoot(go) {
  var done = false;
  function start() { if (done) return; done = true; go(); }
  setTimeout(start, 1500);
  try {
    idb.get(STORE_KEY).then(function (s) { if (!done) { try { applyState(s); } catch (e) { /* ignore */ } } start(); }, start);
  } catch (e) { start(); }
}
function save() { dirty = true; clearTimeout(saveT); saveT = setTimeout(doSave, 250); }
function doSave() {
  dirty = false; clearTimeout(saveT);
  var s = { v: 1, chText: {}, chAdded: {}, chNew: [], books: D.books, articles: D.articles, videos: D.videos, about: { title: SITE.about_title, text: SITE.about_text }, album: D.album };
  CH.forEach(function (c) {
    if (c.user) s.chNew.push(c);
    else {
      s.chText[c.id] = { title: c.title, intro: c.intro, years: c.years };
      var add = c.works.filter(function (w) { return w.user; });
      if (add.length) s.chAdded[c.id] = add;
    }
  });
  idb.set(STORE_KEY, s).catch(function () {
    if (!saveWarned) { saveWarned = true; toast('تعذّر حفظ التعديلات في هذا العارض. ستبقى ما دامت الصفحة مفتوحة.'); }
  });
}

/* ---- pictures: shrink before keeping (phone photos are huge) ---- */
function readImage(file, max, q) {
  return new Promise(function (res) {
    var fr = new FileReader();
    fr.onerror = function () { res(null); };
    fr.onload = function () {
      var im = new Image();
      im.onerror = function () { res(null); };
      im.onload = function () {
        var w = im.naturalWidth, hh = im.naturalHeight;
        if (!w || !hh) { res(null); return; }
        var k = Math.min(1, max / Math.max(w, hh)), cw = Math.max(1, Math.round(w * k)), chh = Math.max(1, Math.round(hh * k));
        try {
          var c = document.createElement('canvas'); c.width = cw; c.height = chh;
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cw, chh); x.drawImage(im, 0, 0, cw, chh);
          res({ url: c.toDataURL('image/jpeg', q), w: cw, h: chh });
        } catch (e) { res({ url: fr.result, w: w, h: hh }); }
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function imageFiles(files) { return Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif)$/i.test(f.name || ''); }); }

/* ---- helpers ---- */
function revealAll() { $$('.rv').forEach(function (e) { e.classList.add('in'); }); }
function refreshText() { renderWords(); renderAbout(); revealAll(); buildSearchIndex(); }
function fillSelect() {
  var gs = $('#gs'), keep = gs.value; gs.textContent = '';
  CH.forEach(function (c, i) { gs.appendChild(h('option', { value: String(i), text: c.title })); });
  gs.value = (keep && +keep < CH.length) ? keep : String(Math.max(0, chapterAt()));
}
function normUrl(v) {
  v = String(v || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[^\s\/:]+\.[^\s]{2,}$/.test(v)) return 'https://' + v;
  return null;
}

/* ---- the form window ---- */
function openForm(opt) {
  var dlg = $('#fm'), body = $('#fmbody'), getters = {}, firstEl = null;
  $('#fmt').textContent = opt.title;
  body.textContent = '';
  opt.fields.forEach(function (f, i) {
    var id = 'f_' + f.k, lab = h('label', { class: 'fld', for: id }), el, val = opt.values && opt.values[f.k] !== undefined ? opt.values[f.k] : '';
    lab.appendChild(h('span', { text: f.label + (f.req ? ' *' : '') }));
    if (f.type === 'area') {
      el = h('textarea', { id: id, rows: '4' }); el.value = val; getters[f.k] = function () { return el.value.trim(); };
    } else if (f.type === 'select') {
      el = h('select', { id: id });
      var opts = f.options.slice(); if (val && opts.indexOf(val) === -1) opts.push(val);
      opts.forEach(function (o) { el.appendChild(h('option', { value: o, text: o })); });
      el.value = val || opts[0]; getters[f.k] = function () { return el.value; };
    } else if (f.type === 'image') {
      var cur = val, prev = h('img', { class: 'prev', alt: '' }), row = h('div', { class: 'row' }), inp = h('input', { type: 'file', accept: 'image/*', id: id, class: 'sr' });
      var pick = h('button', { type: 'button', text: 'اختاري صورة', on: { click: function () { inp.click(); } } });
      var clr = h('button', { type: 'button', text: 'إزالة', on: { click: function () { cur = ''; show(); } } });
      var show = function () { prev.hidden = !cur; clr.hidden = !cur; if (cur) prev.src = cur; pick.textContent = cur ? 'تغيير الصورة' : 'اختاري صورة'; };
      inp.addEventListener('change', function () {
        var f0 = imageFiles(inp.files)[0]; inp.value = '';
        if (!f0) return;
        readImage(f0, 520, 0.85).then(function (r) { if (!r) { toast('تعذّر قراءة هذه الصورة. جرّبي صورة بصيغة JPG أو PNG.'); return; } cur = r.url; show(); });
      });
      row.appendChild(prev); row.appendChild(pick); row.appendChild(clr); row.appendChild(inp); show();
      lab.removeAttribute('for'); getters[f.k] = function () { return cur; };
      el = row;
    } else {
      el = h('input', { id: id, type: 'text', autocomplete: 'off' });
      if (f.type === 'url') { el.setAttribute('dir', 'ltr'); el.setAttribute('inputmode', 'url'); el.setAttribute('placeholder', 'https://'); }
      el.value = val;
      if (f.req) el.required = true;
      getters[f.k] = function () { return el.value.trim(); };
      el.addEventListener('input', function () { el.setCustomValidity(''); });
    }
    if (f.req && f.type === 'area') el.required = true;
    lab.appendChild(el);
    if (f.hint) lab.appendChild(h('small', { text: f.hint }));
    body.appendChild(lab);
    if (!firstEl && f.type !== 'image') firstEl = el;
  });
  var del = $('#fmdel'); del.hidden = !opt.onDelete; del.textContent = 'حذف'; del.classList.remove('sure');
  dlg._opt = { fields: opt.fields, getters: getters, onSave: opt.onSave, onDelete: opt.onDelete };
  $('#fmsave').textContent = opt.saveLabel || 'حفظ';
  dlg.showModal();
  if (firstEl) firstEl.focus();
}
(function () {
  var dlg = $('#fm'), form = $('#fmf');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = dlg._opt; if (!o) return;
    var vals = {}, bad = null;
    o.fields.forEach(function (f) {
      var v = o.getters[f.k]();
      if (f.type === 'url') {
        var u = normUrl(v); var el = $('#f_' + f.k);
        if (u === null) { if (el) el.setCustomValidity('اكتبي عنوانًا صحيحًا يبدأ بـ https://'); if (!bad) bad = el; }
        else { v = u; if (el) el.setCustomValidity(''); }
      }
      vals[f.k] = v;
    });
    if (bad) { bad.reportValidity(); return; }
    o.onSave(vals); dlg.close();
  });
  $('#fmcancel').addEventListener('click', function () { dlg.close(); });
  $('#fmdel').addEventListener('click', function () {
    var b = $('#fmdel'), o = dlg._opt;
    if (!b.classList.contains('sure')) { b.classList.add('sure'); b.textContent = 'اضغطي مرة ثانية للحذف'; setTimeout(function () { b.classList.remove('sure'); b.textContent = 'حذف'; }, 4000); return; }
    if (o && o.onDelete) o.onDelete(); dlg.close();
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();

/* ---- books, articles, videos ---- */
var KINDS = {
  book: {
    word: 'كتاب', arr: function () { return D.books; },
    fields: [
      { k: 'title', label: 'عنوان الكتاب', req: true },
      { k: 'sub', label: 'الناشر والسنة', hint: 'اختياري. مثل: دار فواصل · ٢٠٢٦' },
      { k: 'note', label: 'نبذة قصيرة', type: 'area', hint: 'اختياري' },
      { k: 'badge', label: 'شارة', hint: 'اختياري. مثل: جديد · ٢٠٢٦' },
      { k: 'cover', label: 'صورة الغلاف', type: 'image', hint: 'اختياري' },
      { k: 'url', label: 'رابط', type: 'url', hint: 'اختياري. صفحة الكتاب أو مراجعة عنه' },
      { k: 'link', label: 'الكلمات التي تظهر على الرابط', hint: 'اختياري. مثل: قراءة المراجعة' }
    ]
  },
  article: {
    word: 'مقال', arr: function () { return D.articles; },
    fields: [
      { k: 'tag', label: 'نوع المقال', type: 'select', options: ['كُتب عنها', 'بقلمها'] },
      { k: 'title', label: 'عنوان المقال', req: true },
      { k: 'note', label: 'المصدر والتاريخ', hint: 'اختياري. مثل: جنوبيات · ٢١ آب ٢٠٢٦' },
      { k: 'url', label: 'رابط', type: 'url', hint: 'اختياري' }
    ]
  },
  video: {
    word: 'فيديو', arr: function () { return D.videos; },
    fields: [
      { k: 'prog', label: 'اسم البرنامج أو القناة', hint: 'اختياري' },
      { k: 'title', label: 'عنوان الفيديو', req: true },
      { k: 'dur', label: 'المدة', hint: 'اختياري. مثل: ٢٦:٠٢' },
      { k: 'note', label: 'ملاحظة', hint: 'اختياري' },
      { k: 'url', label: 'رابط', type: 'url', hint: 'اختياري' }
    ]
  }
};
function openItem(kind, i) {
  var K = KINDS[kind], arr = K.arr(), cur = i >= 0 ? arr[i] : null;
  var nameAr = kind === 'book' ? 'الكتاب' : kind === 'article' ? 'المقال' : 'الفيديو';
  openForm({
    title: cur ? 'تعديل ' + nameAr : 'إضافة ' + K.word + ' جديد',
    fields: K.fields, values: cur || {}, saveLabel: cur ? 'حفظ التعديل' : 'أضيفي',
    onSave: function (v) {
      var item = {}; Object.keys(v).forEach(function (k) { item[k] = v[k]; });
      if (cur) arr[i] = item; else arr.push(item);
      save(); refreshText();
      toast(cur ? 'تم حفظ التعديل.' : 'أُضيف ' + nameAr + '. هكذا يظهر في الموقع.');
      var el = $('#words [data-k="' + kind + '"][data-i="' + (cur ? i : arr.length - 1) + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    },
    onDelete: cur ? function () { arr.splice(i, 1); save(); refreshText(); toast('حُذف ' + nameAr + '.'); } : null
  });
}
HOOKS.words = function (root) {
  if (!EDIT.on) return;
  function tile(kind, label) { return h('button', { type: 'button', class: 'addtile', 'data-add': kind, text: label }); }
  var shelf = $('#shelf', root); if (shelf) shelf.appendChild(tile('book', '＋ أضيفي كتابًا'));
  var arts = $('#articles', root); if (arts) arts.appendChild(tile('article', '＋ أضيفي مقالًا'));
  var vids = $('#videos .vids', root); if (vids) vids.appendChild(tile('video', '＋ أضيفي فيديو'));
  $$('[data-k]', root).forEach(function (el) {
    el.setAttribute('title', 'اضغطي للتعديل');
    if (el.tagName !== 'A') { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); }
  });
};

/* ---- About: the text, the title and the photos ---- */
function commitAbout() {
  var t = $('#aboutTitle'), b = $('#aboutBody');
  if (t && t.isContentEditable) SITE.about_title = t.textContent.replace(/\s+/g, ' ').trim() || 'عنها';
  if (b && b.isContentEditable) SITE.about_text = (b.innerText || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
HOOKS.about = function () {
  if (!EDIT.on) return;
  var al = $('#album'), t = $('#aboutTitle'), b = $('#aboutBody');
  /* photos */
  al.hidden = false;
  $$('figure', al).forEach(function (fig, i) {
    fig.appendChild(h('button', { type: 'button', class: 'rm', 'aria-label': 'حذف هذه الصورة', text: '×', on: { click: function () { D.album.splice(i, 1); save(); renderAbout(); revealAll(); toast('حُذفت الصورة.'); } } }));
  });
  var inp = h('input', { type: 'file', accept: 'image/*', multiple: true });
  inp.addEventListener('change', function () {
    var fs = imageFiles(inp.files); inp.value = '';
    if (!fs.length) { toast('اختاري ملفات صور فقط.'); return; }
    Promise.all(fs.map(function (f) { return readImage(f, 900, 0.85); })).then(function (rs) {
      rs = rs.filter(Boolean); if (!rs.length) { toast('تعذّر قراءة الصور. جرّبي صورًا بصيغة JPG أو PNG.'); return; }
      rs.forEach(function (r) { D.album.push({ thumb: r.url, full: r.url, w: r.w, h: r.h }); });
      save(); renderAbout(); revealAll(); toast('أُضيفت ' + ar(rs.length) + (rs.length === 1 ? ' صورة' : ' صور') + ' إلى «' + (SITE.about_title || 'عنها') + '».');
    });
  });
  al.insertBefore(h('label', { class: 'addtile' }, [h('span', { text: '＋ أضيفي صورًا' }), inp]), al.firstChild);
  /* title */
  t.setAttribute('contenteditable', PT); t.setAttribute('role', 'textbox'); t.setAttribute('aria-label', 'عنوان القسم');
  t.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); t.blur(); } });
  t.addEventListener('input', function () { commitAbout(); save(); });
  /* body */
  b.textContent = String(SITE.about_text || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).join('\n\n');
  b.classList.add('edit');
  b.setAttribute('contenteditable', PT); b.setAttribute('role', 'textbox'); b.setAttribute('aria-multiline', 'true');
  b.setAttribute('aria-label', 'نص القسم. اكتبي هنا، واتركي سطرًا فارغًا بين الفقرات'); b.setAttribute('data-ph', 'اكتبي هنا نبذة عنها. اتركي سطرًا فارغًا بين الفقرات.');
  b.addEventListener('input', function () { commitAbout(); save(); });
  if (PT !== 'plaintext-only') b.addEventListener('paste', function (e) {
    var tx = (e.clipboardData || window.clipboardData); if (!tx) return;
    e.preventDefault(); document.execCommand('insertText', false, tx.getData('text'));
  });
};

/* ---- periods and pictures ---- */
function openPeriod(ci) {
  var c = ci >= 0 ? CH[ci] : null;
  openForm({
    title: c ? 'تعديل المرحلة' : 'مرحلة جديدة من العمر',
    fields: [
      { k: 'title', label: 'اسم المرحلة', req: true },
      { k: 'intro', label: 'كلمات عن هذه المرحلة', type: 'area', hint: 'اختياري. تظهر على أول صفحة من المرحلة' },
      { k: 'years', label: 'السنوات', hint: 'اختياري. مثل: ١٩٩٨ - ٢٠٠٤' }
    ],
    values: c ? { title: c.title, intro: c.intro, years: c.years } : {}, saveLabel: c ? 'حفظ التعديل' : 'أضيفي المرحلة',
    onSave: function (v) {
      if (c) {
        c.title = v.title; c.intro = v.intro; c.years = v.years;
        save(); rebuildKeep(B.chStart[ci]); fillSelect(); $('#gs').value = String(ci); toast('تم حفظ التعديل.');
      } else {
        var col = NEWCOL[newCount % NEWCOL.length]; newCount++;
        var id = 'u' + Date.now().toString(36) + newCount;
        CH.push({ id: id, user: true, title: v.title, intro: v.intro, years: v.years, bg: col[0], deep: col[1], works: [] });
        save(); rebuildKeep(0); goChapter(CH.length - 1); fillSelect(); $('#gs').value = String(CH.length - 1);
        toast('أُضيفت المرحلة «' + v.title + '». أضيفي صورها من الشريط الأسود في أسفل الصفحة.');
      }
    },
    onDelete: (c && c.user) ? function () {
      CH.splice(ci, 1); save(); rebuildKeep(0); fillSelect(); toast('حُذفت المرحلة.');
    } : null
  });
}
function addFiles(ci, files, asPhoto) {
  var imgs = imageFiles(files);
  if (!imgs.length) { toast('اختاري ملفات صور فقط.'); return; }
  Promise.all(imgs.map(function (f) { return readImage(f, 1400, 0.86); })).then(function (rs) {
    var ok = rs.filter(Boolean), failed = rs.length - ok.length;
    if (!ok.length) { toast('تعذّر قراءة الصور. جرّبي صورًا بصيغة JPG أو PNG.'); return; }
    var before = CH[ci].works.length;
    ok.forEach(function (r) { CH[ci].works.push({ thumb: r.url, full: r.url, w: r.w, h: r.h, cap: '', photo: !!asPhoto, user: true }); });
    save(); rebuildKeep(B.chStart[ci]);
    /* land on the first page that holds the new pictures */
    var land = B.chEnd[ci];
    for (var q = B.chStart[ci]; q <= B.chEnd[ci]; q++) { var pg = B.pages[q]; if (pg && pg.kind === 'paint' && pg.from + pg.count > before) { land = q; break; } }
    turn(pageToPos(land));
    fillSelect(); $('#gs').value = String(ci);
    toast('أُضيفت ' + ar(ok.length) + (ok.length === 1 ? ' صورة' : ' صور') + ' إلى «' + CH[ci].title + '».' + (failed ? ' تعذّرت ' + ar(failed) + ' منها.' : ''));
  });
}
HOOKS.work = function (fig, ci, wi, w) {
  if (!EDIT.on || !w.user) return;
  fig.appendChild(h('button', { type: 'button', class: 'rm', 'aria-label': 'حذف هذه الصورة', text: '×', on: { click: function () {
    CH[ci].works.splice(wi, 1); save(); rebuildKeep(B.chStart[ci]); toast('حُذفت الصورة.');
  } } }));
};

/* ---- switching the editor on and off ---- */
function setEdit(v) {
  if (!v) commitAbout();
  EDIT.on = v; document.body.classList.toggle('edit', v);
  $('#editbar').hidden = !v;
  var eb = $('#editBtn'); eb.setAttribute('aria-pressed', v ? 'true' : 'false'); eb.textContent = v ? 'إنهاء التحرير' : 'تحرير الموقع';
  if (v) fillSelect();
  refreshText();
  if (!$('#allView').hidden) buildAll(true);
  if (v) toast('وضع التحرير مفعّل.');
}
function initPreview() {
  $('#draft').hidden = false;
  $('#editBtn').addEventListener('click', function () { setEdit(!EDIT.on); });
  $('#draftClose').addEventListener('click', function () { $('#draft').hidden = true; });
  $('#newPeriod').addEventListener('click', function () { openPeriod(-1); });
  $('#editPeriod').addEventListener('click', function () { var i = +$('#gs').value; openPeriod(isNaN(i) ? Math.max(0, chapterAt()) : i); });
  $('#resetAll').addEventListener('click', function () {
    toast('سيُمسح كل ما أضفتِه أو عدّلتِه في هذه النسخة.', 'امسحي', function () {
      clearTimeout(saveT);
      var go = function () { try { location.reload(); } catch (e) { /* ignore */ } };
      idb.del(STORE_KEY).then(go, go);
    });
  });
  $('#gf').addEventListener('change', function () { var fs = Array.prototype.slice.call(this.files); this.value = ''; addFiles(+$('#gs').value, fs, $('#gphoto').checked); });
  /* clicks on the words section: add a tile, or open an item to change it */
  var words = $('#words');
  words.addEventListener('click', function (e) {
    if (!EDIT.on) return;
    var add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); openItem(add.getAttribute('data-add'), -1); return; }
    var it = e.target.closest('[data-k]');
    if (it) { e.preventDefault(); openItem(it.getAttribute('data-k'), +it.getAttribute('data-i')); }
  }, true);
  words.addEventListener('keydown', function (e) {
    if (!EDIT.on || (e.key !== 'Enter' && e.key !== ' ')) return;
    var it = e.target.closest && e.target.closest('[data-k]');
    if (it && it === e.target && it.tagName !== 'A') { e.preventDefault(); openItem(it.getAttribute('data-k'), +it.getAttribute('data-i')); }
  });
  /* dropping picture files anywhere adds them to the chosen period */
  window.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1) e.preventDefault(); });
  window.addEventListener('drop', function (e) {
    if (!(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length)) return;
    e.preventDefault();
    if ($('#fm').open) return;
    if (!EDIT.on) { toast('اضغطي «تحرير الموقع» أولًا، ثم اسحبي الصور.'); return; }
    addFiles(+$('#gs').value, e.dataTransfer.files, $('#gphoto').checked);
  });
  window.addEventListener('pagehide', function () { commitAbout(); if (dirty) doSave(); });
}
