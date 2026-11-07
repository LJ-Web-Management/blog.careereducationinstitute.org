# Career Education Institute blog: cei.ictraining.us/blog

The Career Education Institute blog, in its own repository `LJ-Web-Management/blog.careereducationinstitute.org`, and
published at **https://cei.ictraining.us/blog/**, under the main site (`LJ-Web-Management/www.careereducationinstitute.org`,
https://cei.ictraining.us/). The main site's deploy workflow checks out this repo, builds it with
`SITE_URL=<main site>/blog` and copies its `dist/` into the main site's `dist/blog/`, so both go out as one GitHub
Pages site. This repo's own Pages address (https://lj-web-management.github.io/blog.careereducationinstitute.org/)
only redirects old links to the same page under cei.ictraining.us/blog/.

## How it fits together
| Piece | Where it comes from |
|---|---|
| Posts | `src/content/blog/<slug>/post.json` plus cover images, created from zip uploads |
| Header, footer, stylesheet, site scripts | The main site's `/assets/shell.json`, read at build time, so menus and styles always match. A copy of the last one is kept in `src/shell.json` in case the main site can't be reached |
| Favicons, newsletter pop-up script, generic blog share image | Served by the main site (`/favicon.ico`, `/assets/newsletter.js`, `/og/blog.png`) |
| Newsletter sign-up and unsubscribe pages | The main site (`/newsletter/`) |
| What this repo builds | The blog pages and `sitemap.xml` (listed in the main site's `robots.txt`), plus two files the main site reads: `search-index.json` (merged into site search) and `posts.json` (latest posts on the homepage) |

Writing links: posts and code write blog pages as `/blog/<slug>/` and main-site pages as `/careers/...`, `/training/...`
and so on. The build turns `/blog/...` into the blog's address and every other path into the main site's
(`site.config.mjs`: `url` and `mainUrl`). Post text can write `{careers}` for the current number of career profiles.

## Everyday tasks
| Task | How |
|---|---|
| Publish a blog post | Upload a zip to `blog-uploads/` on GitHub. See **BLOG-UPLOAD-GUIDE.md** |
| Have Codex write and publish a post | Send Codex the one-line prompt at the top of **BLOG-POST-PROMPT.md** |
| Change the menus, footer or styles | Change them in the main site; its deploy rebuilds the blog with them |

Every push to `main` imports uploaded zips, rebuilds and audits the blog, then asks the main site to redeploy, which
publishes the blog at /blog/. That last step needs the secret `SITE_DISPATCH_TOKEN` here (a fine-grained token with
**Contents: read and write** on the main site's repository). Without it, new posts go live on the main site's next deploy
(it also redeploys every 6 hours). Optional repository variables: `BLOG_URL` (the blog's address, default
`https://cei.ictraining.us/blog`), `MAIN_SITE_URL` and `MAIN_SITE_REPO` (default `LJ-Web-Management/www.careereducationinstitute.org`).

## Local preview
Keep the main site checked out next to this folder as `www.careereducationinstitute.org` and build it first.
```
npm ci
npm run build      # writes dist/ (the blog page /blog/<slug>/ is dist/<slug>/)
npm run audit      # titles, descriptions, H1s, canonicals, links (main-site links too, when its dist/ is next door), schema, em dashes
npm run serve      # http://localhost:4174/ (the main site's own preview runs at http://localhost:4173)
```
