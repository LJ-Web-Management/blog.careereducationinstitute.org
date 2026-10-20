// Builds the Career Education Institute blog into dist/. Usage: node scripts/build.mjs
// The blog is its own site (blog.careereducationinstitute.org). Pages are written as /blog/... paths, so /blog/my-post/
// is dist/my-post/index.html. The header, footer and stylesheet come from the main site (src/lib/layout.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cfg from '../site.config.mjs';
import { abs, esc, href } from '../src/lib/util.mjs';
import { layout, loadShell, pageHero } from '../src/lib/layout.mjs';
import { blogPages, loadPosts } from '../src/pages/blog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const t0 = Date.now();
const out = (p) => path.join(DIST, p.replace(/^\/blog\/?/, ''));

await loadShell(ROOT);
const posts = loadPosts(path.join(ROOT, 'src/content/blog'));
const pages = blogPages({ posts });
pages.push({ path: '/blog/404/', file: '404.html', noindex: true, title: 'Page Not Found | Career Education Institute Blog', desc: 'This blog page could not be found. Browse the latest articles from the Career Education Institute blog or search the site.',
  body: `${pageHero({ crumbs: [['Home', '/'], ['Blog', '/blog/']], eyebrow: '404', h1: 'We couldn’t find that article', lead: 'It may have moved. Browse the latest posts or search the site.', meta: false })}<div class="wrap" style="padding:30px 20px 60px"><p><a class="btn btn-primary" href="${href('/blog/')}">Latest articles</a> <a class="btn" href="${href('/search/')}">Search the site</a></p></div>` });

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const p of pages) {
  // No em dashes in published pages (style rule); convert any that slip through.
  const html = (p.raw ? p.content : layout(p)).replace(/[ \t]*—[ \t]*/g, ', ');
  const file = p.file ? path.join(DIST, p.file.replace(/^blog\//, '')) : path.join(out(p.path), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
for (const p of posts) {
  const dir = path.join(DIST, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const img of p.images) fs.copyFileSync(path.join(p.dir, img), path.join(dir, img));
}
if (fs.existsSync(path.join(ROOT, 'static'))) fs.cpSync(path.join(ROOT, 'static'), DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// Share images: 1200x630 crops of the covers
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.warn('! sharp not installed: share images skipped'); }
if (sharp) {
  fs.mkdirSync(path.join(DIST, 'og'), { recursive: true });
  await Promise.all(posts.filter((p) => p.cover).map((p) => sharp(path.join(p.dir, p.cover)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(DIST, 'og', p.slug + '.jpg'))));
}

// The sitemap (listed in this site's robots.txt), plus two files the main site reads: search entries (merged into
// its site search, so they carry full URLs) and the latest posts (shown on its homepage).
const indexable = pages.filter((p) => !p.noindex && !p.raw);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `<url><loc>${esc(abs(p.path))}</loc><lastmod>${p.modified || cfg.updated}</lastmod></url>`).join('\n')}\n</urlset>\n`);
const snip = (d = '', n = 120) => (d.length <= n ? d : d.slice(0, d.lastIndexOf(' ', n)).replace(/[,;:.\s]+$/, '') + '…');
fs.writeFileSync(path.join(DIST, 'search-index.json'), JSON.stringify(indexable.filter((p) => p.kind).map((p) => ({ t: p.name || p.title, u: abs(p.path), d: snip(p.desc), y: p.kind, ...(p.keywords ? { k: p.keywords } : {}) }))));
// This blog is its own site, so it has its own robots.txt (it takes effect once the custom domain is connected).
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/blog/sitemap.xml')}\n`);
fs.writeFileSync(path.join(DIST, 'posts.json'), JSON.stringify(posts.map((p) => ({ slug: p.slug, title: p.title, description: p.description, category: p.category, date: p.date, ...(p.updated ? { updated: p.updated } : {}) }))));

console.log(`Built ${pages.length} blog pages (${posts.length} posts) for ${abs('/blog/')} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
