// Settings for the Career Education Institute blog (this repo, blog.careereducationinstitute.org).
// The blog is its own site. SITE_URL is injected by the GitHub Pages workflow: the repo's github.io address
// (https://lj-web-management.github.io/blog.careereducationinstitute.org) until the custom domain is connected, then
// https://blog.careereducationinstitute.org. Blog pages are written as /blog/... paths and published at the root of
// this site; every other path (/careers/..., /assets/..., /favicon.ico) is the main site, at mainUrl.
const url = (process.env.SITE_URL || 'http://localhost:4174').replace(/\/$/, '');
// MAIN_SITE_URL overrides; otherwise: the local main site, www.careereducationinstitute.org once this blog runs on
// careereducationinstitute.org, or else the main site's current live address, https://cei.ictraining.us.
const mainUrl = (process.env.MAIN_SITE_URL || (/localhost/.test(url) ? 'http://localhost:4173' : /(^|\.)careereducationinstitute\.org$/.test(new URL(url).hostname) ? 'https://www.careereducationinstitute.org' : 'https://cei.ictraining.us')).replace(/\/$/, '');

export default {
  name: 'Career Education Institute',
  shortName: 'CEI',
  legalName: 'Industrial Certified Training, LLC',
  description: 'Career advice, industry news, salary updates and training tips from Career Education Institute.',
  url, // this blog's origin + base path, no trailing slash
  basePath: new URL(url).pathname.replace(/\/$/, ''), // '' on the custom domain, '/blog.careereducationinstitute.org' on github.io
  mainUrl, // the main site's origin + base path, no trailing slash

  // Header, footer and stylesheet come from the main site so the blog always matches it.
  // The build reads them from <main site>/assets/shell.json (see src/lib/layout.mjs).
  shellUrl: process.env.SHELL_URL || `${mainUrl}/assets/shell.json`,
  mainSiteDist: '../www.careereducationinstitute.org/dist', // local fallback when building next to the main site

  email: 'info@hazwoper-osha.com',
  launched: '2026-10-15',
  updated: '2026-10-20',
  verification: { google: '', bing: '' }
};
