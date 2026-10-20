import cfg from '../../site.config.mjs';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// Blog pages are written as /blog/... and live at the root of this site (after the github.io base path, if any).
// Any other root path (/careers/..., /assets/..., /favicon.ico) is a page or file of the main site.
const inBlog = (p) => p === '/blog' || p.startsWith('/blog/');
export const href = (p = '/') => (/^(https?:|mailto:|tel:|#)/.test(p) ? p : inBlog(p) ? cfg.basePath + (p.slice(5) || '/') : cfg.mainUrl + p);
// Absolute URL for canonicals, sitemaps and structured data.
export const abs = (p = '/') => (/^https?:/.test(p) ? p : inBlog(p) ? cfg.url + (p.slice(5) || '/') : cfg.mainUrl + p);

export const money = (n) => (n == null ? 'N/A' : '$' + Math.round(n).toLocaleString('en-US'));
export const money2 = (n) => (n == null ? 'N/A' : '$' + Number(n).toFixed(2));
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const pct = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};
export const year = () => Number(cfg.updated.slice(0, 4));

export const clamp = (s, max = 158) => {
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\-–—]$/, '') + '…';
};

// Builds a <title>, adding the brand only when it still fits in ~60 characters.
export const fitTitle = (main) => {
  const suffix = ` | ${cfg.name}`;
  return (main + suffix).length <= 60 ? main + suffix : main;
};

export const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
export const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const shuffle = (arr, seed) => {
  const r = rng(typeof seed === 'number' ? seed : hash(String(seed)));
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export const article = (word) => (/^[aeiou]/i.test(word) && !/^(uni|use|eu)/i.test(word) ? 'an' : 'a');
export const lowerFirst = (s) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
// Title-case task names ("Verify a Circuit Is De-Energized") as an in-sentence phrase; keeps acronyms and proper nouns.
const KEEP_CASE = new Set(['I', 'Git', 'English', 'Spanish', 'Medicare', 'Medicaid', 'Excel', 'Google', 'Windows', 'Linux', 'Heimlich', 'Miranda']);
export const taskPhrase = (s) => s.replace(/[A-Za-z’']+/g, (w) => (KEEP_CASE.has(w.replace(/’s$|'s$/, '')) || !/^[A-Z][^A-Z]*$/.test(w) ? w : w.toLowerCase()));
export const listJoin = (items, conj = 'and') =>
  items.length <= 1 ? items.join('') : items.length === 2 ? `${items[0]} ${conj} ${items[1]}` : `${items.slice(0, -1).join(', ')}, ${conj} ${items.at(-1)}`;
export const wordCount = (html) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

// ---------- Minimal Markdown (guides, resources, blog posts) ----------
const inline = (s) => {
  let out = esc(s).replace(/^\[ \]\s*/, '☐ ').replace(/^\[x\]\s*/i, '☑ ');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    const u = url.replace(/&amp;/g, '&');
    const ext = /^https?:/.test(u) && !u.startsWith(cfg.url);
    return `<a href="${esc(href(u))}"${ext ? ' rel="noopener"' : ''}>${text}</a>`;
  });
  return out;
};

export function md(src, { headingIds = true } = {}) {
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const toc = [];
  let para = [], list = null, quote = [], table = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' ')).replace(/\u2028 ?/g, '<br>')}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<aside class="callout"><p>${inline(quote.join(' '))}</p></aside>`); quote = []; } };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !/^\|?\s*:?-{2,}/.test(r)).map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    const [head, ...body] = rows;
    out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    table = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      flushAll();
      const level = m[1].length; const text = m[2].trim(); const id = slugify(text);
      if (level === 2) toc.push({ id, text: text.replace(/^\d+[.)]\s*/, '') });
      out.push(`<h${level}${headingIds ? ` id="${id}"` : ''}>${inline(text)}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) { flushAll(); out.push('<hr>'); continue; }
    if (/^<(button|p|div|form|section|aside|figure|img|details|iframe)\b/.test(line.trim())) { flushAll(); out.push(line.trim()); continue; }
    if (line.startsWith('|')) { flushPara(); flushList(); flushQuote(); table.push(line.trim()); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); flushTable(); quote.push(m[1]); continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
      flushPara(); flushQuote(); flushTable();
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(m[1]); continue;
    }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara(); flushQuote(); flushTable();
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(m[1]); continue;
    }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
    flushList(); flushQuote(); flushTable();
    para.push(line.trim() + (/ {2}$/.test(raw) ? '\u2028' : ''));
  }
  flushAll();
  return { html: out.join('\n'), toc };
}
