# Career Education Institute blog: blog.careereducationinstitute.org

The Career Education Institute blog, as its own static site in the repository
`LJ-Web-Management/blog.careereducationinstitute.org`. It is published with GitHub Pages at
https://lj-web-management.github.io/blog.careereducationinstitute.org/ and, once the custom domain is connected, at
https://blog.careereducationinstitute.org/. The main site is `LJ-Web-Management/www.careereducationinstitute.org`; its
README (**The blog**) has the custom-domain steps.

## How it fits together
| Piece | Where it comes from |
|---|---|
| Posts | `src/content/blog/<slug>/post.json` plus cover images, created from zip uploads |
| Header, footer, stylesheet, site scripts | The main site's `/assets/shell.json`, read at build time, so menus and styles always match. A copy of the last one is kept in `src/shell.json` in case the main site can't be reached |
| Favicons, newsletter pop-up script, generic blog share image | Served by the main site (`/favicon.ico`, `/assets/newsletter.js`, `/og/blog.png`) |
| Newsletter sign-up and unsubscribe pages | The main site (`/newsletter/`) |
| What this repo publishes | The blog pages, `sitemap.xml` and `robots.txt`, plus two files the main site reads: `search-index.json` (merged into site search) and `posts.json` (latest posts on the homepage) |

Writing links: posts and code write blog pages as `/blog/<slug>/` and main-site pages as `/careers/...`, `/training/...`
and so on. The build turns `/blog/...` into this site's address and every other path into the main site's
(`site.config.mjs`: `url` and `mainUrl`). Post text can write `{careers}` for the current number of career profiles.

## Everyday tasks
| Task | How |
|---|---|
| Publish a blog post | Upload a zip to `blog-uploads/` on GitHub. See **BLOG-UPLOAD-GUIDE.md** |
| Have Codex write and publish a post | Send Codex the one-line prompt at the top of **BLOG-POST-PROMPT.md** |
| Change the menus, footer or styles | Change them in the main site; its next deploy refreshes the blog (or run this repo's workflow) |

Every push to `main` imports uploaded zips, rebuilds, audits and deploys (GitHub Actions to Pages). With the optional
`MAIN_SITE_REPO` variable and `SITE_DISPATCH_TOKEN` secret set, it then asks the main site to rebuild so its homepage
shows the new post. `MAIN_SITE_URL` (optional variable) overrides the main site's address, for example while only one
of the two custom domains is connected.

## Local preview
Keep the main site checked out next to this folder as `www.careereducationinstitute.org` and build it first.
```
npm ci
npm run build      # writes dist/ (the blog page /blog/<slug>/ is dist/<slug>/)
npm run audit      # titles, descriptions, H1s, canonicals, links (main-site links too, when its dist/ is next door), schema, em dashes
npm run serve      # http://localhost:4174/ (the main site's own preview runs at http://localhost:4173)
```
