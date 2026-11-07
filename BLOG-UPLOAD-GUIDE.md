# How to publish a blog post (zip upload)

You can publish a new blog post without touching any code. Put your article and image in a zip file,
upload it to the `blog-uploads` folder on GitHub, and the website publishes it automatically.

## 1. Write the article as a .txt file

Use any text editor (Notepad, TextEdit in plain-text mode, Google Docs → Download → Plain text).

Put a few optional settings at the very top, then `---`, then the article:

```
Title: How to Choose Between Two Job Offers
Description: A simple way to compare pay, benefits, growth and commute so you pick the right offer.
Date: 2026-11-02
Category: Career Advice
Tags: job offers, salary, career advice
Author: Jane Smith
Alt: Two job offer letters on a desk
---
Choosing between two good offers is a great problem to have, but it can still be stressful.

## Start with total pay
Compare base pay, overtime, bonuses and benefits, not just the hourly rate.

## Look at growth
- Will you learn new skills?
- Is there a clear path to promotion?

Read more in our [salary negotiation guide](/guides/how-to-negotiate-salary/).
```

Only `Title` really matters. If you leave out the settings block completely, the first line of the
file becomes the title.

| Setting | What it does | If you leave it out |
|---|---|---|
| Title | Post headline (also the page title on Google) | First line of the file is used |
| Description | Summary shown on Google and social media (aim for 120–155 characters) | First paragraph is used |
| Date | Publish date, `YYYY-MM-DD` | The upload date |
| Category | Groups posts (e.g. Career Advice, Career Trends, For Employers) | Career Advice |
| Tags | Comma-separated keywords | None |
| Author | Byline | Career Education Institute |
| Alt | Image description for screen readers and SEO | The title |

### Formatting you can use in the article
- A blank line starts a new paragraph.
- `## Heading` makes a section heading (use these: they help SEO and create the “On this page” menu).
- `- item` makes a bullet list; `1. item` makes a numbered list.
- `**bold**` and `*italic*`.
- `[link text](https://example.com)` or internal links like `[electrician salary](/careers/electrician/salary/)`.
- `> text` makes a highlighted tip box.
- Extra images: add the image file to the zip and write `![description](photo-name.jpg)` where it should appear.

## 2. Add an image
Add one image (JPG, PNG or WebP) to the zip. It becomes the cover image and the image shown when the
post is shared. Landscape images around **1600 × 900 pixels** look best. The site automatically resizes
and compresses it for fast loading.

## 3. Zip the files
Select the `.txt` file and the image together → right-click → **Compress** (Mac) or
**Send to → Compressed (zipped) folder** (Windows). Name the zip anything you like.

You can also put several posts in one zip: name each pair the same, e.g. `job-offers.txt` + `job-offers.jpg`
and `resume-tips.txt` + `resume-tips.jpg`.

## 4. Upload it to GitHub
1. Open the blog repository on GitHub (github.com/LJ-Web-Management/blog.careereducationinstitute.org) and click the **blog-uploads** folder.
2. Click **Add file → Upload files**.
3. Drag in your zip and click **Commit changes**.

That’s it. In about 3–6 minutes the post is live at `cei.ictraining.us/blog/<post-title>/`, listed on the blog page,
added to the sitemap and RSS feed, and the zip is removed from the folder.

## If something goes wrong
- Check the **Actions** tab on GitHub (here, and in the main site's repository, whose deploy publishes the blog): a red ✗
  means the build failed; click it to see why.
- If a zip can’t be read, a file named `FAILED-<your-zip>.txt` appears in `blog-uploads` explaining why.
  Fix the zip, upload it again, and delete the FAILED note.
- To edit or remove a post later, edit or delete its folder in `src/content/blog/`.
