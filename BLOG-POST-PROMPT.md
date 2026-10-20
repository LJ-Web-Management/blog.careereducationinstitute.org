# Codex prompt: write, illustrate and publish one blog post

> **How to use:** in Codex, on this repository, send:
> `Follow BLOG-POST-PROMPT.md to choose an SEO topic, then write, illustrate and publish one new blog post.`
> To force a topic, add `Topic: <your topic>`. You can also paste everything below the line as the prompt.
> For a Codex scheduled task (automation), use the short prompt just below.

## Scheduled task prompt
For a Codex scheduled task (automation), paste this as the task prompt (1553 characters). It points back to this file for the full rules.

```text
Publish one new post to the Career Education Institute blog. This runs unattended: don't ask questions, make sound choices, and stop without pushing if any step fails.

Repos (branch main): this blog, https://github.com/LJ-Web-Management/blog.careereducationinstitute.org, and next to it the main site, https://github.com/LJ-Web-Management/www.careereducationinstitute.org, cloned into a folder named www.careereducationinstitute.org. Clone or git pull both, then run npm ci in both.

Follow BLOG-POST-PROMPT.md in the repo root exactly, all 8 steps. It has the full rules, and BLOG-UPLOAD-GUIDE.md has the article format. In short:
1. If a post dated today is already in src/content/blog/, stop.
2. Pick the topic for SEO: study the newest 20 posts (or all, if fewer) and the sitemap pages, shortlist 5 long-tail topics no page already targets, choose the best.
3. Write 1,100-1,600 words. Facts only from the main site's src/data/labor.json and src/data/careers/. 4-8 internal links to pages that exist. No em dashes. Only the Markdown the prompt allows.
4. Generate a 1600x900 brand-palette illustration with no text in it. If you can't generate images, stop.
5. Import with node scripts/import-blog.mjs <zip>. Never put the zip in blog-uploads/.
6. npm run build in the main site, then npm run build and npm run audit here must show 0 errors, and the leftover-markup check must pass.
7. Commit only src/content/blog/<slug>/, push to main and confirm the GitHub Action deploy succeeded.

Report the topic shortlist and why you chose it, the title, the word count and https://lj-web-management.github.io/blog.careereducationinstitute.org/<slug>/
```

---

You are publishing one new post to the Career Education Institute blog
(repository https://github.com/LJ-Web-Management/blog.careereducationinstitute.org, a static blog built with
`npm run build` and deployed to GitHub Pages on every push to `main`: https://lj-web-management.github.io/blog.careereducationinstitute.org/,
later https://blog.careereducationinstitute.org/). The rest of the site is the main site repository,
https://github.com/LJ-Web-Management/www.careereducationinstitute.org. Keep it next to this one in a folder named `www.careereducationinstitute.org`:
facts, links to check and the shared header, footer and stylesheet come from it.
Work through every step in order. Do not skip the checks.

## Inputs
- **Topic:** none by default; you choose it in step 2. If I named a topic, use it and only run the overlap check in step 2.2.
- **Category:** one of `Career Advice`, `Career Trends`, `For Employers`, chosen in step 2 unless I named one.

## 1. Set up
1. If you are not already in the repositories, clone both into the same parent folder:
   `git clone https://github.com/LJ-Web-Management/blog.careereducationinstitute.org.git` and
   `git clone https://github.com/LJ-Web-Management/www.careereducationinstitute.org.git`; otherwise `git pull` on
   `main` in both. Then run `npm ci` in both (Node 20 or newer). Commands below run in the blog repo unless noted.
2. Read `BLOG-UPLOAD-GUIDE.md` (article format) and `scripts/import-blog.mjs` (how a post is imported).
3. Run `npm run build` in the main site, then here, so both `dist/` folders exist; you will use them to find real
   pages to link to.

## 2. Choose a great SEO topic
1. **Study the last 20 posts** (all of them if there are fewer than 20), newest first:
   ```
   node -e "const fs=require('fs'),d='src/content/blog',ps=fs.readdirSync(d).filter(s=>fs.existsSync(d+'/'+s+'/post.json')).map(s=>JSON.parse(fs.readFileSync(d+'/'+s+'/post.json','utf8'))).sort((a,b)=>b.date.localeCompare(a.date));console.log(ps.length+' posts; showing newest '+Math.min(20,ps.length));for(const p of ps.slice(0,20))console.log('\n'+p.date+' | '+p.category+' | '+p.title+'\n  tags: '+(p.tags||[]).join(', ')+'\n  sections: '+(p.body.match(/^## .*/gm)||[]).map(h=>h.slice(3)).join(' / '))"
   ```
   Note which categories, career fields, careers, audiences (students, career changers, working
   professionals, employers) and search phrases they already cover.
2. **Know what the rest of the site already targets.** Every one of the 709 careers already has pages for its
   overview, salary, how to become, day in the life, skills, interview questions, FAQ and fit quiz. There are
   also about 2,200 "X vs. Y" comparisons, 14 "best careers" lists, 46 guides and, per job, a hiring guide,
   job description and onboarding plan. List every page with
   `grep -ho '<loc>[^<]*' ../www.careereducationinstitute.org/dist/sitemap-*.xml dist/sitemap.xml | sed 's#<loc>[a-z]*://[^/]*##'`.
   The new post must not target the same search phrase as any of these pages or any existing post
   (they would compete for the same ranking). Go after a question they do not answer, then link to them.
3. **Shortlist 5 candidate topics.** For each, write: the primary search phrase (a specific, natural
   question or long-tail phrase of 3 to 8 words), the search intent, who searches it, what data or pages on
   this site let us answer it better than most results, and the closest existing page or post and why it
   does not compete. Favor topics that:
   - have real search demand: if you can browse, check Google autocomplete, "People also ask" and related
     searches, and skim the top results to find what they miss; if you cannot, reason from how people
     actually phrase the question;
   - fill a gap in the last 20 posts: an under-covered category, career field or audience. Do not make a
     career that was the main subject of any of those posts the main subject again. If 2 of the 3 newest
     posts share a category, use a different one unless the best topic clearly belongs there;
   - are winnable: a specific long-tail question beats a broad term ("how long does phlebotomy training
     take" beats "healthcare careers");
   - lead naturally to a career profile and a training or course page on this site;
   - suit the time of year when that helps (January career changes, spring graduation, fall BLS
     projections, back to school, year-end hiring plans).
4. **Pick the strongest candidate** and keep the shortlist and your reasoning for the final report.

## 3. Gather facts (no invented numbers)
- Pay and outlook come only from `../www.careereducationinstitute.org/src/data/labor.json`: `careers.<career>.wages` (median, p10, p25, p75, p90),
  `growthPct`, `annualOpenings`, `employment`. Label them the way the site does: pay is
  "BLS, May 2025" (`meta.oewsLabel`), growth is "projected 2025–35" (`meta.projections`).
- Career details (duties, training time, licensing) come from `../www.careereducationinstitute.org/src/data/careers/*.mjs`.
- You may cite an official source (bls.gov, onetonline.org, dol.gov, osha.gov, fmcsa.dot.gov, a state
  board) only if you actually opened it and it says what you claim. Otherwise leave the claim out.
- Never invent statistics, surveys, studies, quotes, testimonials or named people.

## 4. Write the article
Pick a short hyphenated file name for this post (for example `medical-assistant-interview`), written below
as `<name>`. Save the article as `<name>.txt` in a new temporary folder **outside the repository**
(for example `/tmp/blog-post/`). Use exactly this header, then `---`, then the article:

```
Title: <title>
Description: <description>
Date: <today, YYYY-MM-DD>
Category: <category>
Tags: <3 to 5 lowercase tags, comma-separated>
Author: Career Education Institute Curriculum Team
Alt: <cover image description>
---
<article in the Markdown described in BLOG-UPLOAD-GUIDE.md>
```

**Title:** 40 to 60 characters, includes the primary search phrase, specific and honest (no clickbait),
unique on the site. **Description:** 120 to 155 characters, says what the reader will learn.

**Article quality bar:**
- 1,100 to 1,600 words. U.S. audience. Plain, warm, direct, second person, about an 8th to 10th grade
  reading level. Short paragraphs (2 to 4 sentences).
- Answer the main question within the first 100 words, then go deeper.
- Use the primary search phrase naturally in the title, the description, the first 100 words and one
  `##` heading. Phrase other headings the way people ask related questions. Never stuff keywords.
- 5 to 8 `##` section headings (they build the "On this page" menu); `###` only for sub-points.
- At least one bulleted or numbered list, one `> ` tip box, and concrete examples or steps a reader can act on.
  A small Markdown table is fine when it makes a comparison clearer.
- End with a short "Next steps" section that points to the most relevant pages.
- 4 to 8 internal links, using root-relative paths like `/careers/electrician/salary/`. **Every link must
  be a page that exists**: check that `../www.careereducationinstitute.org/dist/<path>index.html` exists, or `dist/<slug>/index.html`
  for another blog post (or find it in the sitemaps).
  Include, where natural: the matching career profile, its salary or how-to-become page, its training page
  (`/training/<career>/`), a related guide (`/guides/...`) and the Career Match Quiz (`/quizzes/career-match/`).
- Mention Career Education Institute training only where it truly helps the reader, at most twice, never pushy.
- When the post says how many careers the site covers, write `{careers}` (for example "salary data for {careers}
  careers"). The build fills in the current number, so the post never goes out of date.

**Formatting:** the site uses its own small Markdown renderer. Use only these:
- `## Heading`, `### Subheading` (`####` also works). Always put a space after the hashes.
- A blank line between paragraphs. A single line break inside a paragraph is ignored and the lines run
  together. End a line with two spaces only when you truly need a line break inside a paragraph.
- `**bold**`, `*italic*` and `` `code` `` for inline styling.
- `- item` bullets and `1. item` numbered lists, one level only. If an item wraps onto a new line,
  indent that line 2 spaces.
- `> text` for the tip box. Consecutive `>` lines merge into one box with one paragraph.
- Links: `[text](/careers/electrician/)` for this site, `[text](https://www.bls.gov/...)` for others.
- Tables: `| A | B |` rows with a `|---|---|` row under the first one, which becomes the header.
  Keep cells short and never put a `|` inside a cell.
- `---` alone on a line makes a divider (use sparingly). `[x] ` or `[ ] ` at the start of a line
  renders as ☑ or ☐.
- Extra images (optional): `![description](file.jpg)`, only if that file is in the zip. A missing file
  makes the whole line disappear silently.

These do **not** work and show up as raw symbols or broken layout, so never use them: a single `#`
heading (the title comes from the `Title:` line), `##Heading` with no space, `_italic_` or `__bold__`,
nested or indented sub-bullets (they flatten into one list), bare URLs (not clickable; always use
`[text](url)`), code fences (```` ``` ````), footnotes and raw HTML.

**Never:**
- Use an em dash (U+2014) anywhere, including the header lines. The site bans them, and the build silently turns
  each one into a comma, which reads badly. The audit will not catch it, so check yourself. Use commas,
  periods, colons or parentheses instead.
- Promise jobs, pay, promotions, licensure or exam results, or say our courses are accredited, give
  academic credit, qualify for federal aid or replace state-required training.
- Give medical, legal or financial advice, or name competitors.
- Use filler or stock AI phrases ("in today's fast-paced world", "delve", "navigate the landscape",
  "unlock your potential", "game-changer", "In conclusion").

## 5. Generate the cover image
1. Use your image generation tool (the latest GPT Image model). If you have no built-in tool but
   `OPENAI_API_KEY` is set, call the OpenAI Images API with the same prompt at 1536×1024.
   If neither is possible, **stop before publishing** and tell me. Never use stock photos, images
   copied from the web, placeholders or the brand logos.
2. Art direction: a landscape editorial illustration that clearly shows the post's subject (for example
   a medical assistant taking a patient's blood pressure, or a supervisor walking a new hire through a
   warehouse). Modern flat or semi-flat illustration, clean shapes, soft light, generous negative space.
   Palette built on the brand colors: deep navy `#022350`, teal `#037890`, gold `#cc9628`, warm cream
   `#faf8f3`, with natural skin tones. People stylized (not photorealistic), diverse, in realistic
   U.S. workplace settings, wearing correct safety gear for the job.
   **No text, letters, numbers, logos, signage words, watermarks or UI screenshots anywhere in the image.**
3. Look at the result. Regenerate (up to 3 tries) if it has any text or pseudo-text, distorted hands or
   faces, wrong or missing safety gear, or does not match the topic.
4. Crop it to exactly 1600×900 and save it next to the article with the same base name, from the repo root:
   `node -e "require('sharp')(process.argv[1]).resize(1600,900,{fit:'cover',position:'attention'}).jpeg({quality:90}).toFile(process.argv[2]).then(i=>console.log(i.width+'x'+i.height))" <generated-file> /tmp/blog-post/<name>.jpg`
5. Write the `Alt:` line: a specific description of what the image shows, under 125 characters,
   not starting with "Image of".

## 6. Import with the site's own importer
1. Zip the pair: `cd /tmp/blog-post && zip -j <name>.zip <name>.txt <name>.jpg` (install `zip`/`unzip` if missing).
2. From the repo root: `node scripts/import-blog.mjs /tmp/blog-post/<name>.zip`
   It must print `✓ Published: <title> → /blog/<slug>/`. The importer builds `<slug>` from the **Title**
   (not the file name); use that exact `<slug>` from here on. It creates `src/content/blog/<slug>/` with
   `post.json`, `cover.jpg` and `cover.webp`. Do **not** put the zip in `blog-uploads/` or the repository:
   the GitHub Action saves zip uploads before it runs the audit, so a bad zip there would block every deploy.
3. To fix anything later, edit the `.txt`, re-zip and re-import. If you changed the title, delete the
   old `src/content/blog/<old-slug>/` folder first so there is only one copy.

## 7. Check before publishing (all must pass)
1. `npm run build`, then `npm run audit` → must report **0 errors**; fix any warning about this post too.
2. `dist/<slug>/index.html` exists; `src/content/blog/<slug>/cover.jpg` is 1600×900.
3. Word count is 1,100 to 1,600; no em dash (U+2014) anywhere in `post.json`; every internal link resolves (the audit checks this).
4. No formatting leaked through as raw symbols. This must print `No leftover markup`:
   `node -e "const h=require('fs').readFileSync('dist/'+process.argv[1]+'/index.html','utf8');const t=h.split('<article class=\"prose\">')[1].split('</article>')[0].replace(/<[^>]+>/g,' ');const bad=t.match(/(^|\s)#\s|#{2,}|\*\*|__|\x60|\]\(|(^|\s)_[^_\s][^_]*_(?=[\s.,;:!?]|$)|https?:\/\/\S+/g);console.log(bad?'Leftover markup: '+[...new Set(bad.map(s=>s.trim()))].join('  '):'No leftover markup')" <slug>`
   Then open the page in a browser if you can (or read the HTML) and confirm the headings, lists, tip box
   and any table look right.
5. Read the post once more as an editor: facts match `labor.json`, no repetition, every section earns its place.
6. `git status` shows only the new `src/content/blog/<slug>/` folder (`dist/` is ignored). Nothing else changed.

## 8. Publish
1. Commit only `src/content/blog/<slug>/` with the message `Add blog post: <title>` and push to `main`.
   If you cannot push to `main`, open a pull request into `main` and tell me it must be merged to go live.
2. The push triggers the "Build and deploy" GitHub Action. If `gh` is available, wait for it and confirm it succeeded.
3. Report back: the topic shortlist and why the winner won, the primary search phrase, the title,
   description, category, word count, the internal links used, the image prompt you used, and the live URL:
   `https://lj-web-management.github.io/blog.careereducationinstitute.org/<slug>/`
   (once the custom domain is connected: `https://blog.careereducationinstitute.org/<slug>/`).
