# Longhouse Builders website — guide for AI-assisted changes

This repo is **www.conservationbuilder.com** (Longhouse Builders, Hayfield, High Peak), replatformed
from Squarespace. It follows the same architecture as `VigoProjects/studiovigo-site`, so content and
layout changes can be made by describing them in plain English. Read this file before changing anything.

## Stack
- **Astro** (static pages + one serverless function for the contact form), hosted on **Vercel**.
- **Tailwind CSS v4**. Design tokens (colours, fonts) live in `src/styles/global.css` (`@theme`).
- Brand: deep green `#0a2c27` + olive `#aeac4f` (from the logo). Fonts as on the old site, self-hosted via
  Fontsource: **Ovo** (headings) and **Almarai** (body).
- No client-side framework; the few interactions (mobile menu, service accordions) use native `<details>`.
- All content is **files in this repo** — no database, no CMS login.
- Every push to a branch gets a Vercel **preview URL**. `main` is **production**.

## Content
| You want to change… | Edit this |
|---|---|
| Text, order or sections of a page | `src/content/pages/<page>.yaml` (`home.yaml` is `/`) |
| A project (portfolio) | `src/content/projects/<slug>.md` |
| Phone, email, address, navigation, footer text, analytics | `src/content/site.yaml` |
| Colours, fonts | `src/styles/global.css` |
| How a block looks | `src/components/blocks/<Name>.astro` |
| Block fields / validation | `src/content/blocks.ts` |
| Structured data for Google | `src/lib/schema.ts` (facts come from `site.yaml`) |
| Redirects, headers | `vercel.json` |
| Images | `public/assets/` (reference as `/assets/…`) |

### Page blocks (`type:` in the YAML)
| type | What it is |
|---|---|
| `hero` | Opener: eyebrow, heading, body, two buttons, image. `layout: split` (text beside image, default) or `overlay` (text over full-bleed image) |
| `pageHeader` | Simple page title for inner pages |
| `services` | Numbered stages, each with a list of what's included (accordion) |
| `quote` | Large testimonial |
| `projects` | Grid of projects from `src/content/projects` (`featured: [slugs]` to pick some) |
| `logos` | Row of accreditation/partner logos |
| `prose` | Markdown text with optional image alongside (`imageSide: left/right`) |
| `contact` | Contact details + enquiry form (emails via `/api/contact`) |
| `cta` | Call-to-action band |

Every block also accepts `id` (anchor, e.g. `services` for `/#services`) and
`background: paper | stone | moss`. **The build fails on an unknown block or a missing field.**

### Projects
Each project shows as a card. It gets its own page at `/projects/<slug>` only when `page: true`
is set **and** the file has a write-up below the front matter. Add `image:` (and optionally
`gallery:`) with real `alt` text. Photos go in `public/assets/projects/`.

### Missing images
`src/components/Img.astro` shows a stone-textured placeholder when an image file doesn't exist yet,
so a page never shows a broken image. If you see placeholders, the photo hasn't been added.

## Rules for making changes
0. **Never push to `main`.** Branch, open a pull request, share the Vercel preview link. Only merge when asked.
1. **Prefer content edits over code edits.** Don't hard-code copy inside components.
2. **Reuse existing blocks.** New block = schema in `blocks.ts` + component + `BlockRenderer.astro` + row in the table above.
3. **Use the design tokens.** No raw hex values in components.
4. **Keep URLs stable.** Renaming a published URL needs a 301 in `vercel.json`.
5. **SEO:** every page needs `title` and `description` (150–160 chars). Images need real `alt` text.
6. **Images:** prefer `.webp`/`.jpg` under ~300 KB. Width/height are added automatically at build time.
7. **Before finishing, run `npm run build`** and fix any errors.
8. **No secrets in the repo.** API keys live in Vercel environment variables.
9. **Analytics are consent-gated.** Vercel Web Analytics (cookieless) is always on. If a GTM ID is set in
   `site.yaml`, a cookie banner appears and GTM only loads after "Accept all" (UK PECR/GDPR).

## Contact form
`src/pages/api/contact.ts` emails enquiries via Resend. Vercel env vars: `RESEND_API_KEY`,
`CONTACT_TO`, `CONTACT_FROM` (a verified sender on longhousebuilders.co.uk). Spam protection: honeypot,
plus invisible reCAPTCHA v3 when `PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` are set.

## Housekeeping
- `.github/workflows/import-legacy.yml` mirrors the old Squarespace site into `legacy/` and copies the
  images in `scripts/legacy-assets.txt` into `public/assets/`. It already ran (Nov 2026); it's
  manual-only now (Actions tab). Delete it and `legacy/` once the new site is live.
- Domain: the canonical domain is `www.conservationbuilder.com`. Non-production hosts send `noindex`.
