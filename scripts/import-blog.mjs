// Imports blog posts from zip files dropped into blog-uploads/.
// Each zip contains one .txt article and one image (or several pairs: post-a.txt + post-a.jpg ...).
// Usage: node scripts/import-blog.mjs          (processes every zip in blog-uploads/)
//        node scripts/import-blog.mjs file.zip (processes one zip)
// See BLOG-UPLOAD-GUIDE.md for the .txt format.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = path.join(ROOT, 'blog-uploads');
const OUT = path.join(ROOT, 'src/content/blog');
const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.warn('! sharp not installed — images will be copied without optimization'); }

const today = () => new Date().toLocaleDateString('en-CA');
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.name.startsWith('__MACOSX') || e.name.startsWith('.') ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

function parseTxt(raw) {
  let text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
  const meta = {};
  const lines = text.split('\n');
  let i = 0;
  const keyRe = /^(title|description|summary|date|category|tags|author|slug|alt|image alt|cover alt)\s*:\s*(.*)$/i;
  while (i < lines.length && keyRe.test(lines[i].trim())) {
    const [, k, v] = lines[i].trim().match(keyRe);
    meta[k.toLowerCase().replace(/^(image|cover) alt$/, 'alt').replace('summary', 'description')] = v.trim();
    i++;
  }
  if (i > 0 && /^-{3,}$/.test((lines[i] || '').trim())) i++;
  let body = lines.slice(i).join('\n').trim();
  if (!meta.title) {
    const first = body.split('\n').find((l) => l.trim());
    meta.title = (first || 'Untitled post').replace(/^#+\s*/, '').trim();
    body = body.slice(body.indexOf(first) + first.length).trim();
  }
  // Plain-text files with no blank lines: treat each line as its own paragraph.
  if (!/\n\s*\n/.test(body) && body.includes('\n')) body = body.split('\n').map((l) => l.trim()).filter(Boolean).join('\n\n');
  if (!meta.description) {
    const para = body.split(/\n\s*\n/).find((p) => p.trim() && !/^(#|-|\*|\d+\.|>|\|)/.test(p.trim())) || meta.title;
    const plain = para.replace(/[*_`#>\[\]]|\(http[^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    meta.description = plain.length > 155 ? plain.slice(0, 152).replace(/\s+\S*$/, '') + '…' : plain;
  }
  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    const d = new Date(meta.date);
    meta.date = isNaN(d) ? today() : d.toLocaleDateString('en-CA');
  }
  return { meta, body };
}

async function saveImage(src, destDir, base, maxW = 1600) {
  const ext = path.extname(src).toLowerCase();
  if (!sharp || ext === '.gif') {
    const name = base + ext;
    fs.copyFileSync(src, path.join(destDir, name));
    return { file: name };
  }
  const img = sharp(src).rotate();
  const m = await img.metadata();
  const width = Math.min(m.width || maxW, maxW);
  const resized = img.resize({ width, withoutEnlargement: true });
  const jpg = base + '.jpg', webp = base + '.webp';
  const info = await resized.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(destDir, jpg));
  await resized.clone().webp({ quality: 78 }).toFile(path.join(destDir, webp));
  return { file: jpg, webp, width: info.width, height: info.height };
}

async function importZip(zipPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-blog-'));
  try {
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', tmp]);
    const files = walk(tmp);
    const txts = files.filter((f) => /\.(txt|md)$/i.test(f));
    const imgs = files.filter((f) => IMG.test(f));
    if (!txts.length) throw new Error('No .txt article found in the zip');
    const created = [];
    for (const txt of txts) {
      const { meta, body: rawBody } = parseTxt(fs.readFileSync(txt, 'utf8'));
      const baseName = path.basename(txt).replace(/\.(txt|md)$/i, '').toLowerCase();
      const paired = imgs.filter((f) => path.basename(f).replace(IMG, '').toLowerCase() === baseName);
      const cover = paired[0] || (txts.length === 1 ? imgs.find((f) => /cover|hero|featured/i.test(path.basename(f))) || imgs.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0] : null);
      let slug = slugify(meta.slug || meta.title);
      let dir = path.join(OUT, slug);
      let n = 2;
      while (fs.existsSync(path.join(dir, 'post.json')) && JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8')).title !== meta.title) { dir = path.join(OUT, `${slug}-${n}`); n++; }
      slug = path.basename(dir);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const post = { slug, title: meta.title, description: meta.description, date: meta.date || today(), category: meta.category || 'Career Advice', tags: (meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean), author: meta.author || '', coverAlt: meta.alt || meta.title, source: path.basename(zipPath), imported: today() };
      if (cover) {
        const saved = await saveImage(cover, dir, 'cover');
        Object.assign(post, { cover: saved.file, coverWebp: saved.webp, width: saved.width, height: saved.height });
      }
      // Inline images referenced as ![alt](filename.jpg) are optimized and rewritten as sized <img> tags.
      let body = rawBody;
      for (const m of [...rawBody.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)]) {
        const file = imgs.find((f) => path.basename(f).toLowerCase() === path.basename(m[2]).toLowerCase());
        if (!file) { body = body.replace(m[0], ''); continue; }
        const saved = await saveImage(file, dir, slugify(path.basename(file).replace(IMG, '')) || 'image', 1200);
        const alt = m[1].replace(/"/g, '&quot;');
        body = body.replace(m[0], `\n<img src="./${saved.file}" alt="${alt}"${saved.width ? ` width="${saved.width}" height="${saved.height}"` : ''} loading="lazy" decoding="async" class="cover">\n`);
      }
      post.body = body;
      fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify(post, null, 1));
      created.push(`${post.title} → /blog/${slug}/`);
    }
    return created;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const targets = process.argv[2] ? [path.resolve(process.argv[2])] : fs.existsSync(INBOX) ? fs.readdirSync(INBOX).filter((f) => f.toLowerCase().endsWith('.zip')).map((f) => path.join(INBOX, f)) : [];
if (!targets.length) { console.log('No zip files to import in blog-uploads/.'); process.exit(0); }
fs.mkdirSync(OUT, { recursive: true });
let ok = 0;
for (const z of targets) {
  try {
    const created = await importZip(z);
    created.forEach((c) => console.log('✓ Published:', c));
    if (z.startsWith(INBOX)) fs.rmSync(z);
    const failNote = path.join(INBOX, `FAILED-${path.basename(z)}.txt`);
    if (fs.existsSync(failNote)) fs.rmSync(failNote);
    ok++;
  } catch (e) {
    console.error('✗ Could not import', path.basename(z), '—', e.message);
    if (z.startsWith(INBOX)) fs.writeFileSync(path.join(INBOX, `FAILED-${path.basename(z)}.txt`), `This zip could not be published: ${e.message}\nSee BLOG-UPLOAD-GUIDE.md for the required format, fix the zip and upload it again.\n`);
  }
}
console.log(`Imported ${ok} of ${targets.length} zip file(s).`);
