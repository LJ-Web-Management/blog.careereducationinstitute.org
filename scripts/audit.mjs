// SEO / quality audit of the built blog (dist/), adapted from the main site's audit. Usage: node scripts/audit.mjs
// The blog is its own site: its pages are at the root of cfg.url. Links to the main site are absolute; they are
// checked against the main site's dist/ when it is built next to this repo. Exit code 1 on errors.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cfg from '../site.config.mjs';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const root = cfg.basePath;
const base = root;
const MAIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', cfg.mainSiteDist);
const mainExists = (u) => { // absolute link into the main site: true/false when its dist/ is here, null otherwise
  if (!u.startsWith(cfg.mainUrl + '/') || !fs.existsSync(MAIN)) return null;
  const f = path.join(MAIN, decodeURIComponent(u.slice(cfg.mainUrl.length).split('#')[0].split('?')[0]));
  return fs.existsSync(f) && fs.statSync(f).isFile() ? true : fs.existsSync(path.join(f, 'index.html'));
};
const errors = [], warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const all = walk(DIST);
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const exists = (p) => {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0]);
  if (!clean.startsWith(base + '/') && clean !== base) return null;
  const rel = clean.slice(base.length) || '/';
  const f = path.join(DIST, rel);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? true : fs.existsSync(path.join(f, 'index.html'));
};

const titles = new Map(), descs = new Map(), inbound = new Map();
const pageUrl = (f) => base + '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
let linkCount = 0;

for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = pageUrl(f);
  const is404 = f.endsWith('404.html');
  const noindex = /<meta name="robots" content="noindex/.test(html);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) err(rel, 'missing <title>');
  else {
    const t = title.replace(/&amp;/g, '&');
    if (t.length > 65) warn(rel, `title ${t.length} chars: ${t}`);
    if (t.length < 20) warn(rel, `title short (${t.length})`);
    if (!noindex) titles.set(t, [...(titles.get(t) || []), rel]);
  }
  if (!desc) err(rel, 'missing meta description');
  else {
    const d = desc.replace(/&amp;/g, '&');
    if (d.length > 160) warn(rel, `description ${d.length} chars`);
    if (d.length < 70) warn(rel, `description short (${d.length})`);
    if (!noindex) descs.set(d, [...(descs.get(d) || []), rel]);
  }
  if (html.includes('\u2014')) err(rel, 'contains an em dash');
  if (/\{(careers|pay:[a-z0-9-]+)\}/.test(html)) err(rel, 'unfilled {careers} or {pay:...} token');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(rel, `${h1s} <h1> tags`);
  if (!/<html lang="en-US">/.test(html)) err(rel, 'missing lang');
  if (!/<meta name="viewport"/.test(html)) err(rel, 'missing viewport');
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canon) err(rel, 'missing canonical');
  else if (!is404 && canon !== cfg.url + rel.slice(root.length)) err(rel, `canonical mismatch ${canon}`);
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  if (!og) err(rel, 'missing og:image');
  else if (og.startsWith(cfg.mainUrl + '/') ? mainExists(og) === false : !exists(og.replace(cfg.url, root))) warn(rel, `og:image file not generated: ${og}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { err(rel, 'invalid JSON-LD'); }
  }
  const types = [...html.matchAll(/"@type":"FAQPage"/g)].length;
  if (types > 1) err(rel, 'multiple FAQPage entities');
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) err(rel, 'img without alt');
    if (!/\swidth="/.test(m[0])) warn(rel, 'img without width/height (CLS risk)');
  }
  // Links
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let u = m[1].replace(/&amp;/g, '&');
    if (mainExists(u) === false) { err(rel, `broken main-site link ${u}`); continue; }
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
    if (u.startsWith('./')) u = rel + u.slice(2);
    linkCount++;
    const ok = exists(u);
    if (!ok) { err(rel, `broken link ${u}`); continue; }
    const clean = u.split('#')[0].split('?')[0];
    if (clean.endsWith('/') || !path.extname(clean)) {
      if (!clean.endsWith('/')) warn(rel, `link without trailing slash (redirect): ${u}`);
      if (clean !== rel) inbound.set(clean, (inbound.get(clean) || 0) + 1);
    }
  }
  const size = Buffer.byteLength(html);
  if (size > 300_000) warn(rel, `large HTML (${Math.round(size / 1024)} KB)`);
}

for (const [t, list] of titles) if (list.length > 1) err(list.join(', '), `duplicate title “${t}”`);
for (const [d, list] of descs) if (list.length > 1) err(list.join(', '), `duplicate description`);

// Sitemap checks + orphans
const sm = fs.readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f)).flatMap((f) => [...fs.readFileSync(path.join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
for (const u of sm) {
  const p = u.replace(cfg.url, root) || base + '/';
  if (!exists(p)) err('sitemap', `URL not found: ${u}`);
  if (p !== base + '/' && !inbound.get(p)) warn('orphan', `no internal links to ${p}`);
}
for (const f of ['sitemap.xml', '404.html', 'search-index.json', 'posts.json', 'feed.xml', 'sw.js', 'robots.txt', 'llms.txt']) if (!fs.existsSync(path.join(DIST, f))) err('site', `missing ${f}`);

const show = (label, list, n = 40) => { if (list.length) { console.log(`\n${label} (${list.length}):`); list.slice(0, n).forEach((x) => console.log('  - ' + x)); if (list.length > n) console.log(`  … ${list.length - n} more`); } };
show('ERRORS', errors);
show('WARNINGS', warnings);
console.log(`\nAudited ${htmlFiles.length} HTML pages, ${linkCount} internal links, ${sm.length} sitemap URLs: ${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
