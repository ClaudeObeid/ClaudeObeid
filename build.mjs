// Builds the website.
//   node build.mjs             ->  dist/      (the real site, deployed by Cloudflare Pages)
//   node build.mjs --preview   ->  preview/Claude-Obeid-book-preview.html  (one file, opens anywhere, no internet needed)
//
// What it reads:   content/*.yml  and  media/**   (the only things the owner ever edits)
// What it makes:   resized pictures, one index.html, fonts, page-turn sounds.

import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import YAML from 'yaml';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'preview' : 'dist');
const IMG_RE = /\.(jpe?g|png|webp)$/i;

const SIZES = PREVIEW
  ? { thumb: 760, thumbQ: 68, full: 0 }
  : { thumb: 800, thumbQ: 78, full: 1800, fullQ: 82 };

// One soft tint per period (page colour, brush-stroke colour). Quiet, warm, no strong colours.
const PALETTE = Array.from({ length: 10 }, () => ['#F4F4F2', '#B4B4B1']);  /* every period is plain grey now */

const warn = (m) => console.warn('  ! ' + m);
const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };
const posix = (p) => p.split(path.sep).join('/');

async function readYaml(rel, fallback) {
  const p = path.join(ROOT, rel);
  if (!(await exists(p))) return fallback;
  try {
    const v = YAML.parse(await fs.readFile(p, 'utf8'));
    return v ?? fallback;
  } catch (e) {
    throw new Error(`Could not read ${rel}: ${e.message}\nCheck the spacing and quotes in that file.`);
  }
}

// a list in a content file may be written as a plain list or as { key: [ ... ] } (Pages CMS writes the second form)
const asList = (v, key) => (Array.isArray(v) ? v : (v && Array.isArray(v[key]) ? v[key] : []));
const asArray = (v) => (Array.isArray(v) ? v : (v ? [v] : [])).map((x) => String(x ?? '').trim()).filter(Boolean);
// '/media/paintings/x.jpg' -> 'media/paintings/x.jpg'; anything outside the media folder is refused
const mediaRel = (v) => {
  const r = path.posix.normalize(String(v ?? '').trim().replace(/\\/g, '/').replace(/^\/+/, ''));
  return r.startsWith('media/') && !r.split('/').includes('..') ? r : '';
};
const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
const safeUrl = (u) => { u = str(u); return /^https?:\/\//i.test(u) ? u : ''; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- pictures ----------------------------------------------------------------------------
let imageCount = 0;
async function processImage(relPath, outSubdir, opts = {}) {
  const buf = await fs.readFile(path.join(ROOT, relPath));
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
  const stem = path.basename(relPath).replace(/\.[^.]+$/, '');
  const slug = (stem.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'img').slice(0, 40);
  const base = `${slug}-${hash}`;
  const thumbMax = opts.thumb || SIZES.thumb;
  const meta = await sharp(buf).rotate().metadata();
  const swap = meta.orientation && meta.orientation >= 5;
  const ow = swap ? meta.height : meta.width, oh = swap ? meta.width : meta.height;
  const longEdge = Math.max(ow, oh);

  const make = async (max, q, name) => {
    const { data, info } = await sharp(buf).rotate()
      .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: q, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    return { data, w: info.width, h: info.height, name };
  };

  const thumb = await make(thumbMax, opts.thumbQ || SIZES.thumbQ, `${base}-t.jpg`);
  let full = null;
  if (!PREVIEW && SIZES.full && longEdge > thumbMax * 1.15) full = await make(SIZES.full, SIZES.fullQ, `${base}.jpg`);
  imageCount++;

  if (PREVIEW) {
    const uri = 'data:image/jpeg;base64,' + thumb.data.toString('base64');
    return { thumb: uri, full: uri, w: thumb.w, h: thumb.h };
  }
  const dir = path.join(OUT, 'img', outSubdir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, thumb.name), thumb.data);
  if (full) await fs.writeFile(path.join(dir, full.name), full.data);
  const url = (n) => `img/${outSubdir}/${n}`;
  return { thumb: url(thumb.name), full: url(full ? full.name : thumb.name), w: thumb.w, h: thumb.h };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ---- content -----------------------------------------------------------------------------
async function main() {
  console.log(PREVIEW ? 'Building the one-file preview…' : 'Building the website…');
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const siteIn = (await readYaml('content/site.yml', {})) || {};
  const aboutIn = (await readYaml('content/about.yml', {})) || {};
  const site = {
    tagline: str(siteIn.tagline) || 'لوحاتها وكتبها ولقاءاتها، في أرشيف واحد.',
    book_title: str(siteIn.book_title) || 'كتاب العمر',
    phrases: (Array.isArray(siteIn.phrases) ? siteIn.phrases : []).map(str).filter(Boolean),
    about_title: str(aboutIn.title) || 'عنها',
    about_text: str(aboutIn.text) || str(siteIn.about_text),
    contact_email: str(siteIn.contact_email),
    instagram: safeUrl(siteIn.instagram),
    facebook: safeUrl(siteIn.facebook),
    youtube: safeUrl(siteIn.youtube),
    site_url: safeUrl(siteIn.site_url).replace(/\/+$/, '')
  };

  // captions: picture path -> text (optional)
  const capIn = asList(await readYaml('content/captions.yml', []), 'captions');
  const caps = new Map();
  capIn.forEach((c) => {
    if (!c || !c.image || !str(c.caption)) return;
    caps.set(mediaRel(c.image).toLowerCase(), str(c.caption));
  });
  const capFor = (rel) => caps.get(rel.toLowerCase()) || '';

  // chapters = periods of life. Each one lists its own paintings, in the order they are shown.
  const chIn = asList(await readYaml('content/chapters.yml', []), 'chapters');
  const chapters = [];
  const jobs = [];
  chIn.forEach((c) => {
    if (!c || typeof c !== 'object') return;
    const paint = asArray(c.paintings), snaps = asArray(c.snapshots);
    if (!str(c.title) && !paint.length && !snaps.length) return; // an empty row
    const i = chapters.length;
    const ch = { id: 'c' + (i + 1), title: str(c.title) || 'مرحلة جديدة', intro: str(c.intro), years: str(c.years), bg: PALETTE[i % PALETTE.length][0], deep: PALETTE[i % PALETTE.length][1], works: [] };
    chapters.push(ch);
    paint.forEach((p) => jobs.push({ ch, rel: mediaRel(p), photo: false }));
    snaps.forEach((p) => jobs.push({ ch, rel: mediaRel(p), photo: true }));
  });
  console.log(`  ${jobs.length} pictures in ${chapters.length} periods`);
  const done = await pool(jobs, 4, async (j) => {
    if (!j.rel || !(await exists(path.join(ROOT, j.rel)))) { warn(`Period "${j.ch.title}" lists a picture that is not in the media folder: ${j.rel || '(empty)'}. It was skipped.`); return null; }
    try {
      const r = await processImage(j.rel, 'p');
      return { ...r, cap: capFor(j.rel), photo: j.photo };
    } catch (e) { warn(`Could not read ${j.rel}: ${e.message}. It was skipped.`); return null; }
  });
  jobs.forEach((j, k) => { if (done[k]) j.ch.works.push(done[k]); });

  // pictures uploaded to media/paintings but not placed in any period (a hint, not an error)
  {
    const used = new Set(jobs.map((j) => j.rel.toLowerCase()));
    const unused = [];
    const walk = async (rel) => {
      const dir = path.join(ROOT, rel);
      if (!(await exists(dir))) return;
      for (const e of await fs.readdir(dir, { withFileTypes: true })) {
        if (e.name.startsWith('.')) continue;
        const r = `${rel}/${e.name}`;
        if (e.isDirectory()) await walk(r);
        else if (IMG_RE.test(e.name) && !used.has(r.toLowerCase())) unused.push(r);
      }
    };
    await walk('media/paintings');
    if (unused.length) warn(`${unused.length} picture(s) in media/paintings are not placed in any period, so they are not shown: ${unused.slice(0, 5).join(', ')}${unused.length > 5 ? ', …' : ''}`);
  }

  // portrait + album (the album has no captions on purpose)
  let portrait = null;
  const pRel = mediaRel(aboutIn.portrait);
  if (pRel && (await exists(path.join(ROOT, pRel)))) {
    portrait = await processImage(pRel, 'people', { thumb: 900 });
    if (!PREVIEW) {
      try {
        await sharp(path.join(ROOT, pRel)).rotate()
          .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
          .jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, 'og.jpg'));
      } catch (e) { warn('Could not make the link-preview picture: ' + e.message); }
    }
  } else warn('No portrait set. Choose one in the "About" menu, under "Opening portrait".');
  const album = (await pool(asArray(aboutIn.album).map(mediaRel).filter(Boolean), 4, async (rel) => {
    if (!(await exists(path.join(ROOT, rel)))) { warn(`The About section lists a picture that is not in the media folder: ${rel}`); return null; }
    try { return await processImage(rel, 'album'); }
    catch (e) { warn(`Could not read ${rel}: ${e.message}`); return null; }
  })).filter(Boolean);

  // words
  const booksIn = asList(await readYaml('content/books.yml', []), 'books');
  const books = [];
  for (const b of booksIn) {
    if (!b || !str(b.title)) continue;
    let cover = '';
    const cp = mediaRel(b.cover);
    if (cp) {
      if (await exists(path.join(ROOT, cp))) {
        try { cover = (await processImage(cp, 'books', { thumb: 520 })).thumb; } catch (e) { warn(`Could not read cover ${cp}: ${e.message}`); }
      } else warn(`Book cover ${cp} was not found.`);
    }
    books.push({ title: str(b.title), sub: str(b.sub), note: str(b.note), badge: str(b.badge), cover, url: safeUrl(b.url), link: str(b.link_label) });
  }
  const artsIn = asList(await readYaml('content/articles.yml', []), 'articles');
  const vidsIn = asList(await readYaml('content/videos.yml', []), 'videos');
  const arts = artsIn
    .filter((a) => a && str(a.title)).map((a) => ({ tag: str(a.tag), title: str(a.title), note: str(a.note), url: safeUrl(a.url) }));
  const vids = vidsIn
    .filter((v) => v && str(v.title)).map((v) => ({ prog: str(v.prog), dur: str(v.dur), title: str(v.title), note: str(v.note), url: safeUrl(v.url) }));

  // sounds
  const soundFiles = ['page1.mp3', 'page2.mp3', 'page3.mp3'];
  let sound;
  if (PREVIEW) {
    sound = [];
    for (const s of soundFiles) sound.push('data:audio/mpeg;base64,' + (await fs.readFile(path.join(ROOT, 'src/sound', s))).toString('base64'));
  } else {
    await fs.mkdir(path.join(OUT, 'sound'), { recursive: true });
    for (const s of soundFiles) await fs.copyFile(path.join(ROOT, 'src/sound', s), path.join(OUT, 'sound', s));
    sound = soundFiles.map((s) => 'sound/' + s);
  }

  // the preview keeps the owner's trial edits under a key that changes whenever the starting content changes
  const sig = crypto.createHash('md5').update(JSON.stringify([chapters.map((c) => [c.title, c.intro, c.works.length]), books.map((b) => b.title), arts.map((a) => a.title), vids.map((v) => v.title), site.about_text, album.length])).digest('hex').slice(0, 10);
  const DATA = { preview: PREVIEW, sig, site, chapters, books, articles: arts, videos: vids, album, portrait, sound };

  // ---- the page ----
  let fontsCss = await fs.readFile(path.join(ROOT, 'src/fonts.css'), 'utf8');
  if (PREVIEW) {
    const names = [...new Set([...fontsCss.matchAll(/url\(fonts\/([^)]+)\)/g)].map((m) => m[1]))];
    for (const n of names) {
      const b64 = (await fs.readFile(path.join(ROOT, 'src/fonts', n))).toString('base64');
      fontsCss = fontsCss.split(`url(fonts/${n})`).join(`url(data:font/woff2;base64,${b64})`);
    }
  } else {
    // copy only the fonts the stylesheet really uses
    await fs.mkdir(path.join(OUT, 'fonts'), { recursive: true });
    for (const n of new Set([...fontsCss.matchAll(/url\(fonts\/([^)]+)\)/g)].map((m) => m[1]))) {
      await fs.copyFile(path.join(ROOT, 'src/fonts', n), path.join(OUT, 'fonts', n));
    }
  }
  const css = await fs.readFile(path.join(ROOT, 'src/styles.css'), 'utf8');
  const previewCss = PREVIEW ? await fs.readFile(path.join(ROOT, 'src/preview.css'), 'utf8') : '';
  const previewJs = PREVIEW ? await fs.readFile(path.join(ROOT, 'src/preview.js'), 'utf8') : '';
  const js = (await fs.readFile(path.join(ROOT, 'src/app.js'), 'utf8')).replace('/*__PREVIEW_JS__*/', () => previewJs);
  let html = await fs.readFile(path.join(ROOT, 'src/template.html'), 'utf8');

  const title = 'كلود عبيد · فنانة تشكيلية وكاتبة وباحثة';
  const desc = site.tagline;
  const siteUrl = String(site.site_url || '').trim().replace(/\/+$/, '');
  const abs = (p) => `${siteUrl}/${p}`;
  const metaTags = [
    PREVIEW ? '<meta name="robots" content="noindex,nofollow">' : '',
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="ar_AR">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    !PREVIEW && portrait && siteUrl ? `<meta property="og:image" content="${esc(abs('og.jpg'))}"><meta name="twitter:card" content="summary_large_image">` : '',
    !PREVIEW && siteUrl ? `<meta property="og:url" content="${esc(siteUrl + '/')}"><link rel="canonical" href="${esc(siteUrl + '/')}">` : '',
    `<meta name="theme-color" content="#FDFDFC">`
  ].filter(Boolean).join('\n');

  const noscript = '<noscript><div style="max-width:900px;margin:0 auto;padding:40px 20px;font-family:sans-serif"><h1>كلود عبيد</h1><p>' + esc(site.tagline) + '</p><p>يحتاج هذا الموقع إلى تفعيل JavaScript لعرض الكتاب التفاعلي.</p>' +
    chapters.map((c) => `<h2>${esc(c.title)}</h2><p>${esc(c.intro)}</p>` + c.works.map((w) => `<img src="${esc(w.thumb)}" width="${w.w}" height="${w.h}" alt="${esc(w.cap || c.title)}" loading="lazy" style="max-width:260px;height:auto;margin:6px">`).join('')).join('') + '</div></noscript>';

  const dataJson = JSON.stringify(DATA).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  html = PREVIEW
    ? html.replace(/<!--\/?PREVIEW-->/g, '')
    : html.replace(/<!--PREVIEW-->[\s\S]*?<!--\/PREVIEW-->/g, '');
  html = html
    .replace('__TITLE__', () => esc(title))
    .replace('__DESC__', () => esc(desc))
    .replace('__FAVICON__', () => PREVIEW ? 'data:image/svg+xml;base64,' + (readFileSync(path.join(ROOT, 'public/favicon.svg'))).toString('base64') : 'favicon.svg')
    .replace('__META__', () => metaTags)
    .replace('/*__FONTS__*/', () => fontsCss)
    .replace('/*__CSS__*/', () => css)
    .replace('/*__PREVIEW_CSS__*/', () => previewCss)
    .replace('__NOSCRIPT__', () => (PREVIEW ? '' : noscript))
    .replace('__DATA__', () => dataJson)
    .replace('/*__JS__*/', () => js.replace(/<\/script/gi, '<\\/script'));

  if (PREVIEW) {
    const p = path.join(OUT, 'Claude-Obeid-book-preview.html');
    await fs.writeFile(p, html);
    console.log(`Done: ${p}  (${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB, ${imageCount} pictures)`);
  } else {
    await fs.writeFile(path.join(OUT, 'index.html'), html);
    if (await exists(path.join(ROOT, 'public'))) await fs.cp(path.join(ROOT, 'public'), OUT, { recursive: true });
    console.log(`Done: ${imageCount} pictures resized. The site is in the "dist" folder.`);
  }
}

main().catch((e) => { console.error('\nBuild failed:\n' + (e && e.message ? e.message : e)); process.exit(1); });
