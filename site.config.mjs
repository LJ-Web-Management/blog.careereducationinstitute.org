// Settings for the Career Education Institute blog (this repo).
// The blog is published at /blog/ of the main site, https://cei.ictraining.us/blog/. The main site's deploy workflow
// checks out this repo, builds it with SITE_URL=<main site>/blog and copies dist/ into its own dist/blog/. SITE_URL
// is this blog's address: blog pages are written as /blog/... paths and published under it; every other path
// (/careers/..., /assets/..., /favicon.ico) is the main site, at mainUrl.
// GitHub Pages reports an http:// base_url until "Enforce HTTPS" is ticked, so any address other than localhost is
// written as https:// (as the main site does).
const https = (u) => (/^http:\/\/(localhost|127\.)/.test(u) ? u : u.replace(/^http:\/\//, 'https://'));
const url = https(process.env.SITE_URL || 'http://localhost:4174').replace(/\/$/, '');
// MAIN_SITE_URL overrides; otherwise the main site is the address the blog sits under (.../blog), or for a local
// preview of the blog on its own, the main site's local preview.
const mainUrl = https(process.env.MAIN_SITE_URL || (/\/blog$/.test(url) ? url.slice(0, -'/blog'.length) : /localhost/.test(url) ? 'http://localhost:4173' : 'https://cei.ictraining.us')).replace(/\/$/, '');

export default {
  name: 'Career Education Institute',
  shortName: 'CEI',
  legalName: 'Industrial Certified Training, LLC',
  description: 'Career advice, industry news, salary updates and training tips from Career Education Institute.',
  url, // this blog's origin + base path, no trailing slash
  basePath: new URL(url).pathname.replace(/\/$/, ''), // '/blog' under the main site, '' for a local preview on its own
  mainUrl, // the main site's origin + base path, no trailing slash
  nested: url === mainUrl + '/blog', // true when the blog is served at /blog/ of the main site (it then has no robots.txt of its own)

  // Header, footer and stylesheet come from the main site so the blog always matches it.
  // The build reads them from <main site>/assets/shell.json (see src/lib/layout.mjs). SHELL_URL overrides, as a URL
  // or a file path (the main site's workflow points it at the shell.json it has just built).
  shellUrl: process.env.SHELL_URL || `${mainUrl}/assets/shell.json`,
  mainSiteDist: process.env.MAIN_SITE_DIST || '../www.careereducationinstitute.org/dist', // the main site's built dist/ (shell fallback, link checks)

  email: 'info@hazwoper-osha.com',
  launched: '2026-10-15',
  updated: '2026-10-20',
  verification: { google: '', bing: '' }
};
