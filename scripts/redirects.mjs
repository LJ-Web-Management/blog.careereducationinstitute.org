// Writes redirect-only pages for the blog's old address (this repo's own GitHub Pages site,
// https://lj-web-management.github.io/blog.careereducationinstitute.org/), so old links land on the same page at the
// blog's real address, cfg.url (https://cei.ictraining.us/blog). Run after the build.
// Usage: node scripts/redirects.mjs [outDir]   (default dist-redirects/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cfg from '../site.config.mjs';
import { esc } from '../src/lib/util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.resolve(ROOT, process.argv[2] || 'dist-redirects');
if (!fs.existsSync(DIST)) throw new Error('Build the blog first (npm run build).');

const page = (to) => `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><title>Moved to ${esc(to)}</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${esc(to)}"><meta http-equiv="refresh" content="0; url=${esc(to)}"><script>location.replace(${JSON.stringify(to)} + location.search + location.hash)</script></head><body><p>The Career Education Institute blog has moved: <a href="${esc(to)}">${esc(to)}</a></p></body></html>`;

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
fs.rmSync(OUT, { recursive: true, force: true });
let n = 0;
for (const f of walk(DIST).filter((f) => f.endsWith('index.html'))) {
  const rel = path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  const file = path.join(OUT, rel, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(`${cfg.url}/${rel}`));
  n++;
}
// Any other old address (images, feed, a page that no longer exists): keep the path after the old base and send it on.
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><title>Moved to ${esc(cfg.url)}/</title><meta name="robots" content="noindex"><script>(function(){var p=location.pathname.replace(/^\\/blog\\.careereducationinstitute\\.org/,'');location.replace(${JSON.stringify(cfg.url)}+(p||'/')+location.search+location.hash);})()</script></head><body><p>The Career Education Institute blog has moved: <a href="${esc(cfg.url)}/">${esc(cfg.url)}/</a></p></body></html>`);
// Keep the data files the main site used to read from here, so a main site still on the old settings keeps working.
for (const f of ['posts.json', 'search-index.json']) fs.copyFileSync(path.join(DIST, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`Wrote ${n} redirect pages to ${path.relative(ROOT, OUT)}/ (all pointing to ${cfg.url}/)`);
