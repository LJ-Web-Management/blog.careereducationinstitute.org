// Page shell for blog pages. The header, footer, stylesheet and scripts come from the main site
// (it publishes them at /assets/shell.json on every build), so blog pages always match the rest of the site.
import fs from 'node:fs';
import path from 'node:path';
import cfg from '../../site.config.mjs';
import { esc, href, abs, fmtDate } from './util.mjs';

let S = null;

// Load order: SHELL_URL or <main site>/assets/shell.json, then the main site's local dist/ (when this repo sits
// next to it), then the copy saved in src/shell.json from the last successful build.
export async function loadShell(ROOT) {
  const saved = path.join(ROOT, 'src/shell.json');
  const tries = [];
  if (/^https:/.test(cfg.shellUrl)) tries.push(['url', cfg.shellUrl]);
  tries.push(['file', path.resolve(ROOT, cfg.mainSiteDist, 'assets/shell.json')], ['file', saved]);
  for (const [kind, src] of tries) {
    try {
      const text = kind === 'url'
        ? await fetch(src, { signal: AbortSignal.timeout(10000) }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
        : fs.readFileSync(src, 'utf8');
      S = JSON.parse(text);
      if (src !== saved) fs.writeFileSync(saved, JSON.stringify(S));
      // The shell's links are root paths on the main site; this blog is another site, so make them absolute.
      const origin = new URL(cfg.mainUrl).origin;
      for (const k of ['header', 'footer']) S[k] = S[k].replace(/\s(href|src|action)="\/(?!\/)/g, ` $1="${origin}/`);
      console.log(`Shell from ${src} (main site build ${S.built})`);
      return S;
    } catch (e) {
      console.warn(`! shell not loaded from ${src}: ${e.message}`);
    }
  }
  throw new Error('No site shell found. Build the main site first or set SHELL_URL.');
}

// Number of career profiles on the main site, from its shell.json. Posts write {careers} so the count never goes stale.
export const careerCount = () => S?.careers || null;

export const crumbsHtml = (crumbs) =>
  crumbs?.length ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map(([n, p], i) => `<li>${i === crumbs.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${href(p)}">${esc(n)}</a>`}</li>`).join('')}</ol></nav>` : '';

export const pageHero = ({ crumbs, eyebrow, h1, lead, meta = true, extra = '' }) =>
  `<section class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}${meta ? `<div class="meta"><span>Updated <time datetime="${cfg.updated}">${fmtDate(cfg.updated)}</time></span></div>` : ''}${extra}</div></section>`;

export const ctaCard = ({ title, text, items = [], btn, link }) =>
  `<div class="cta-card"><h2>${esc(title)}</h2><p>${text}</p>${items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}<a class="btn btn-primary" href="${href(link)}">${esc(btn)}</a></div>`;

export const sideLinks = (title, links) =>
  `<nav class="side-box" aria-label="${esc(title)}"><h2>${esc(title)}</h2><ul>${links.map(([t, p]) => `<li><a href="${href(p)}">${esc(t)}</a></li>`).join('')}</ul></nav>`;

export function layout(p) {
  if (!S) throw new Error('loadShell() must run before layout()');
  const { path: pth, title, desc, body, crumbs = [], schema = [], og = '/og/blog.png', ogAlt, type = 'website', noindex = false, scripts = [], published, modified } = p;
  const url = abs(pth);
  const graph = [
    { '@type': ['Organization', 'EducationalOrganization'], '@id': abs('/#org'), name: cfg.name, url: abs('/'), logo: abs('/icons/icon-512.png') },
    { '@type': 'WebSite', '@id': abs('/#website'), name: cfg.name, url: abs('/') },
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description: desc, isPartOf: { '@id': abs('/#website') }, inLanguage: 'en-US', datePublished: published || cfg.launched, dateModified: modified || cfg.updated, primaryImageOfPage: { '@type': 'ImageObject', url: abs(og) }, ...(crumbs.length ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}) }
  ];
  if (crumbs.length) graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map(([n, cp], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(cp) })) });
  graph.push(...schema);
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  const js = [...S.scripts, ...scripts.map((s) => `/assets/${s}.js`)].filter((v, i, a) => a.indexOf(v) === i).map((s) => `<script src="${href(s)}" defer></script>`).join('');
  return `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"><meta property="og:site_name" content="${cfg.name}"><meta property="og:locale" content="en_US"><meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${abs(og)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(ogAlt || title)}"><meta name="twitter:card" content="summary_large_image">${type === 'article' ? `<meta property="article:published_time" content="${published || cfg.launched}"><meta property="article:modified_time" content="${modified || cfg.updated}">` : ''}${cfg.verification.google ? `<meta name="google-site-verification" content="${cfg.verification.google}">` : ''}<meta name="theme-color" content="#022350"><meta name="format-detection" content="telephone=no"><link rel="icon" href="${href('/favicon.ico')}" sizes="32x32"><link rel="icon" href="${href('/favicon-48.png')}" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="${href('/apple-touch-icon.png')}"><link rel="alternate" type="application/rss+xml" title="Career Education Institute Blog" href="${href('/blog/feed.xml')}"><link rel="stylesheet" href="${href(S.stylesheet)}"><script type="application/ld+json">${ld}</script></head><body><a class="skip" href="#main">Skip to main content</a>${S.header}<main id="main">${body}</main>${S.footer}<script>window.MP=${JSON.stringify({ ...S.mp, base: cfg.mainUrl, main: cfg.mainUrl, blog: cfg.url, blogBase: cfg.basePath })}</script>${js}</body></html>`;
}
