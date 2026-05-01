# Blog Rendering Plan for Betterlytics

> **Branch:** `task/blog-rendering-plan`
> **Worktree:** `C:\Users\Thomas\Desktop\Code\BAAgents\BA2`
> **Companion artifact:** the draft `BLOG_DRAFT_EU_GA_ALTERNATIVES.md` lives on branch `task/blog-eu-ga-alternatives`. That post is the concrete shape we are designing the renderer for.

---

## 1. Executive summary

- **Recommendation: render blog posts in the `dashboard/` Next.js app at `/[locale]/(public)/blog`, NOT in the Nextra docs site.** This is despite the user's lean toward docs, and the rationale is below — the deciding factor is that the blog draft is a marketing/conversion asset, not reference documentation, and the dashboard public route group already owns the marketing surface (`PublicTopBar`, `Footer`, `CtaStrip`, `StructuredData`, `seo.ts`, `sitemap.ts`, internal links to `/features`, `/pricing`, `/vs/[competitor]`).
- **Same-origin link equity is the single biggest reason.** The draft links to `/features`, `/pricing`, and `/vs/plausible|matomo|umami|posthog|fathom-analytics|google-analytics`. All of those live in the dashboard app. The docs app is *also* on `betterlytics.io` (under `basePath: "/docs"` — see `docs/next.config.mjs:18`), so cross-origin SEO equity is NOT the problem; the real problem is that the docs app and the dashboard app are **two separate Next.js builds**. Putting the blog in docs means re-implementing `seo.ts`, `StructuredData`, the marketing footer, the comparison-table component, the `CtaStrip`, and locale routing — all of which already exist on the dashboard side.
- **The next-intl + `[locale]` fit is also better on the dashboard side.** Existing public pages already pass through `next-intl` with `localePrefix: 'as-needed'` (`dashboard/src/i18n/routing.ts:6-10`); adding a `/blog` segment slots into that pattern. Nextra has its own i18n model that does not interoperate with `next-intl`.
- **Primary trade-off:** Nextra ships authoring conveniences (frontmatter parsing, MDX wrapper, sidebar/TOC, `nextra-theme-docs`) for free. Going the dashboard route means we add an MDX/markdown pipeline ourselves — but only the slice we actually need (markdown + frontmatter + a small set of components). The draft has H1/H2/H3, tables, image placeholders, FAQ, internal links, external links — all renderable from a small `react-markdown` (or `next-mdx-remote`) setup with `remark-gfm`. That is roughly one engineer-day of boilerplate vs. permanent component duplication if we go to docs.
- **Phase 1 (v1) ships a single file-based `/blog` and `/blog/[slug]` pair with one post, no RSS, no tag filtering. Phases 2 and 3 add filtering, RSS, related-posts.**

---

## 2. Current state of `docs/`

What's there today:

- **Stack:** Nextra 4.6.1, Nextra docs theme 4.6.1, Next 15.4.11, React 19, Tailwind v4, Pagefind for search (`docs/package.json:13-23`).
- **Deployment:** standalone Next build with `basePath: "/docs"` (`docs/next.config.mjs:15-18`). This means it is served at `betterlytics.io/docs/*`. Same origin as dashboard — so cross-origin SEO concerns from putting blog on docs are moot. (How that's actually wired: it's two separate Next standalone deployments behind a routing layer; the dashboard middleware matcher in `dashboard/src/middleware.ts:17` does *not* exclude `/docs`, but `/docs/*` requests are served by the docs container, not by Next routing — confirmed by the fact that docs has no overlap with dashboard's app router.)
- **Routing:** single catch-all `[[...mdxPath]]` route (`docs/src/app/[[...mdxPath]]/page.tsx:1-77`) that imports MDX pages from `docs/src/content/`. Pages are written as plain `.mdx` files with frontmatter (e.g. `docs/src/content/dashboard/funnels.mdx:1-4`).
- **Theme:** `nextra-theme-docs` with `<Layout>`, `<Navbar>`, sidebar, TOC, footer. The footer is a custom marketing-style footer (`docs/src/app/components/footer.tsx`) that **hard-codes absolute URLs back to the dashboard** (`https://betterlytics.io/about`, `https://betterlytics.io/pricing`, etc., lines 25, 38, 100, 113…). That confirms what's true everywhere in this repo: marketing surfaces live on the dashboard side, the docs site reaches *back* to the dashboard for them.
- **OG images:** docs has its own `/api/og` route (`docs/src/app/api/og`) generating per-page OG images from frontmatter. This is one piece worth borrowing.
- **i18n:** none. The docs site has no locale routing. All content is English. Adding multi-locale to Nextra is non-trivial (Nextra's i18n model is folder-based, separate from `next-intl`).
- **No blog/news section exists.** No `_meta.js` entry hints at one.
- **MDX components registered:** `DashboardSectionGrid`, `DashboardSectionCard`, `HostingComparisonTable`, `IntegrationIconRow`, `IntegrationIcon` (`docs/src/mdx-components.js:14-23`). None of these are blog-shaped.

Could a blog go here?

- **Yes, mechanically.** Drop `docs/src/content/blog/eu-alternatives-to-google-analytics.mdx` and a `_meta.js` entry, and Nextra will render it.
- **The fit is poor for these reasons:**
  - The Nextra docs theme renders a sidebar and a "documentation" chrome around content. A marketing blog post wants the marketing chrome (`PublicTopBar` → post → `CtaStrip` → marketing `Footer`), not a docs sidebar.
  - All the cross-links the draft needs (`/features`, `/pricing`, `/vs/plausible`, etc.) point at the dashboard app. From within the docs app these are absolute external URLs (the docs `Footer` already does this — see `docs/src/app/components/footer.tsx:25`). That works for SEO (same origin) but means we cannot use `<Link>` from `next-intl`'s `@/i18n/navigation` to render them, and we cannot honor the user's locale prefix when linking back to the dashboard.
  - `StructuredData` (`Article` + `FAQPage` JSON-LD) would have to be re-built in docs because `dashboard/src/lib/seo.ts` and `dashboard/src/components/StructuredData.tsx` only currently support `organization|website|webpage|contact` — the blog needs `Article|BlogPosting|FAQPage`. Either way we extend, but extending in only one place (dashboard) keeps everything coherent.
  - The sitemap currently lives in the dashboard (`dashboard/src/app/sitemap.ts:73-109`) and explicitly hard-codes the docs page list (`dashboard/src/app/sitemap.ts:29-54`) as non-localized entries. Adding blog posts to that sitemap is one diff if blog is on dashboard; two diffs (or a cross-package sitemap merge) if blog is on docs.
  - Nextra blog theme exists (`nextra-theme-blog`), but mixing it with `nextra-theme-docs` in the same Next app is awkward. The docs site only registers `nextra-theme-docs` at `docs/src/app/layout.tsx:1`.

---

## 3. Current state of `dashboard/(public)/`

- **Stack:** Next 15.4.11, React 19, Tailwind v4, `next-intl` 4.3.4, NextAuth, Radix, TanStack Query, Prisma. No MDX library installed today — verified via `Grep "mdx|next-mdx|contentlayer|fumadocs|velite"` against `dashboard/package.json` (no matches).
- **Public route group:** `dashboard/src/app/[locale]/(public)/` contains `(landing)/`, `about/`, `accept-invite/`, `changelog/`, `contact/`, `demo/`, `dpa/`, `features/`, `forgot-password/`, `pricing/`, `privacy/`, `reset-password/`, `subprocessors/`, `terms/`, `verify-email/`, `vs/[competitor]/`, plus `layout.tsx` and `page.tsx`.
- **Public layout:** `dashboard/src/app/[locale]/(public)/layout.tsx:6-15` wraps everything in `<PublicTopBar>` + `<Footer>` + `<ThemeToggleFab>`. A blog post page added under `(public)/blog/[slug]/page.tsx` would inherit this layout — exactly what the draft needs.
- **i18n:** `next-intl` with locales `['en','da','it','nb']` (`dashboard/src/constants/i18n.ts:4`), `localePrefix: 'as-needed'` (`dashboard/src/i18n/routing.ts:9`), default locale from `NEXT_PUBLIC_DEFAULT_LANGUAGE`. Middleware matcher excludes `api`, `_next`, files with extensions, `dashboard`, `dashboards`, `billing` — `blog` is *not* excluded, so it would be locale-aware.
- **SEO scaffolding:**
  - `dashboard/src/lib/seo.ts:19-92` exports `generateSEO(config, { locale })` — returns Next `Metadata` with canonical URL, hreflang `languages`, OG, Twitter, robots. We will extend it for blog posts.
  - `dashboard/src/lib/seo.ts:114-250` exports `generateStructuredData(config)` for org/website/webpage/contact JSON-LD. We will add `article` and `faqPage` cases.
  - `dashboard/src/components/StructuredData.tsx:4-19` is a tiny server component that injects the `<script type="application/ld+json">` tag.
  - `dashboard/src/app/sitemap.ts:73-109` is the sitemap; entries declared in `STATIC_PAGES` and `getComparisonPages()`. We will add a `getBlogPages()` helper.
  - `dashboard/src/app/robots.ts` already allows `/` and disallows `/dashboard/*`, `/dashboards/*`, `/billing/*`, `/api/*`. `/blog/*` is allowed by default.
- **Existing markdown-ish content pattern:** the changelog (`dashboard/src/content/changelog/`) is a *typed object structure*, not markdown — see `dashboard/src/content/changelog/locales/en.ts:1-50` and the renderer at `dashboard/src/content/changelog/entry-renderer.tsx:1-74`. It supports `text`, `list`, `image` blocks and per-locale arrays. This is a reasonable v1 fallback if we want to avoid adding an MDX dependency at all — but for a 2,000+ word post with H2/H3/tables/links, the typed-object approach is too verbose. Markdown wins.
- **Existing MDX support:** none. Zero MDX libs in `dashboard/package.json`. We will add one.
- **Reusable marketing components:** `CtaStrip` (`@/components/public/ctaStrip`), `ComparisonTable` (`@/components/public/comparison-table`), `Logo`, `ExternalLink`, `Button`, the prose-heavy styling already used by the changelog renderer (see the long `prose prose-slate dark:prose-invert ...` Tailwind class on `ChangelogEntryCard.tsx:33`). The blog renderer can reuse all of these.

---

## 4. Comparison matrix

| Axis | Option A: dashboard `/[locale]/(public)/blog` | Option B: Nextra docs `/docs/blog` |
|---|---|---|
| **Internal linking** to `/features`, `/pricing`, `/vs/[competitor]`, `/dpa`, `/privacy` | Native — same Next app, same `<Link>` from `@/i18n/navigation`, locale-aware. | Cross-app within same origin — links work, but require absolute URLs; locale prefix is not preserved (docs has no locale model). Cross-app means the user crosses Next standalone boundaries, hurting prefetch. |
| **SEO — sitemap unification** | One entry in existing `dashboard/src/app/sitemap.ts` (`STATIC_PAGES` + a new `getBlogPages()`). Hreflang per locale already wired by `localizedPath()`. | Either (a) hardcode each blog slug into the dashboard sitemap (drift risk), (b) add a second sitemap at `/docs/sitemap.xml` and reference it from `robots.txt` (extra plumbing), or (c) merge sitemaps at deploy time. Two of three options are net-new infrastructure. |
| **SEO — canonical URLs and OG/Twitter metadata** | Use existing `generateSEO()` from `seo.ts`; per-post metadata works the same as `/about`, `/features`. | Use Nextra's frontmatter → metadata path (`docs/src/app/[[...mdxPath]]/page.tsx:7-62` already does this), but it's parallel infra to `seo.ts` and OG image generation lives in two places. |
| **SEO — structured data (Article + FAQPage)** | Extend `generateStructuredData` in `seo.ts` to add `article` and `faqPage` types, render via existing `<StructuredData>` server component. ~30 lines. | Add JSON-LD inline in `docs/src/app/[[...mdxPath]]/page.tsx` or via a custom MDX component. Net-new code, parallel to `StructuredData` on the dashboard side. |
| **Layout/branding** | Inherits `(public)/layout.tsx` — `PublicTopBar` + `Footer` + `ThemeToggleFab`. Also access to `CtaStrip` for end-of-post conversion. The marketing chrome a blog post wants. | Inherits Nextra docs theme — sidebar + docs nav + custom `Footer` component (`docs/src/app/components/footer.tsx`). Not the marketing chrome. The sidebar and `editLink={null}` would have to be conditionally hidden for blog posts, fighting the theme. |
| **Authoring DX** | New: needs MDX/markdown pipeline (`next-mdx-remote` or `react-markdown`+`remark-gfm`+`rehype-slug`+`rehype-autolink-headings`), Zod-validated frontmatter, file-based content under `dashboard/src/content/blog/`. ~1 engineer-day to scaffold. | Built-in: drop `.mdx` in `docs/src/content/blog/`, Nextra parses frontmatter, renders TOC, autolinks headings. Highest authoring DX of any option — but only one author, and we already have the docs MDX pipeline to copy patterns from if we want to. |
| **i18n** | Native `next-intl`, `[locale]` segment, hreflang via existing `seo.ts`. v1 can ship English-only by gating on locale at metadata time; v2 can add Danish/Italian/Norwegian translations as `*.{en,da,it,nb}.mdx`. | Nextra has no `next-intl` integration and the docs app has no locale support today. Adding it would be more work than the blog itself. v1 would be English-only with no path to localization. |
| **Build/deploy footprint** | Zero new packages or services; one new content dir, one new route group, two new components, ~50 lines of `seo.ts` extension. | One new content tree, possibly one new theme (or theme override), and possibly a custom secondary sitemap route. Adds runtime surface area to the docs deployment. |
| **Maintenance cost** | One Next app to maintain. Components shared across all marketing surfaces (blog reuses `CtaStrip`, `Footer`, `StructuredData`, `seo.ts`). | Two apps split the marketing surface. Any change to `seo.ts`, `StructuredData`, sitemap, footer links has to ripple to both. Footer already shows this drift cost (`docs/src/app/components/footer.tsx` re-implements the dashboard footer with hardcoded URLs). |

---

## 5. Recommendation + rationale

**Put the blog on the dashboard at `dashboard/src/app/[locale]/(public)/blog/`.**

The honest case for docs is the authoring DX win: Nextra parses MDX out of the box, so you can drop a file and it renders. That's real. But it's a one-time setup cost on the dashboard side (~1 day to wire `next-mdx-remote` or equivalent), versus permanent duplication of the marketing chrome (footer, CTA, structured data, sitemap, internal-link strategy) for every future blog post.

The decisive points:

1. **The blog draft is conversion content, not reference content.** It pitches Betterlytics, links to `/pricing` and `/vs/*`, and ends with a CTA. The dashboard public route group is the conversion surface; the docs app is the reference surface. Putting the blog on docs is putting it in the wrong category.
2. **Internal links from the post point at dashboard pages.** Same origin, but cross-app. Native `<Link>` from `@/i18n/navigation` only works inside the dashboard app — locale-aware prefetching to `/features` from a docs page degrades to a hard navigation.
3. **`next-intl` + `[locale]` is the existing pattern for everything user-facing.** All four locales have full message catalogs (`dashboard/messages/{en,da,it,nb}.json`). Even if v1 ships English-only, the routing slot is there for future translations. Nextra has no story for that on this codebase.
4. **`seo.ts` and the sitemap are the source of truth.** Adding `Article` + `FAQPage` to `generateStructuredData()` and a `getBlogPages()` helper to `sitemap.ts` keeps every SEO concern in one file. Going to docs forks that.

**The trade-off to be honest about:** we are choosing one engineer-day of MDX-pipeline boilerplate over a permanent two-app split. That's a small cost vs. a recurring one — but it is real, and it means v1 will not feel as effortless to author as a Nextra page. The mitigation is a thin authoring helper and a Zod-validated frontmatter schema (below).

---

## 6. Implementation plan (recommended path)

### 6.1 File structure

```
dashboard/
  src/
    app/[locale]/(public)/blog/
      page.tsx                      # /blog index (post list)
      [slug]/
        page.tsx                    # /blog/[slug] single post
      feed.xml/
        route.ts                    # /blog/feed.xml RSS (Phase 2)
    content/blog/
      posts/
        2026-05-01-eu-alternatives-to-google-analytics.mdx
        # future: -<slug>.{en,da,it,nb}.mdx for localized posts
      authors/
        team.ts                     # author metadata (name, role, avatar)
      schema.ts                     # Zod frontmatter schema + types
      registry.ts                   # build-time post index (see 6.4)
      mdx-components.tsx            # MDX components (Image, ExternalLink, Callout, etc.)
    components/blog/
      BlogPostHeader.tsx            # title, eyebrow, author, date, reading time
      BlogPostBody.tsx              # MDXRemote wrapper with prose styling
      BlogPostFooter.tsx            # citations, related posts, CTA
      BlogPostCard.tsx              # post-list tile
      BlogIndexHero.tsx             # /blog hero section
      BlogFAQ.tsx                   # MDX <FAQ> wrapper rendering FAQPage JSON-LD
      BlogTOC.tsx                   # right-rail table of contents (sticky, optional v1)
public/blog/
  cover/                            # static cover images (next/image will optimize)
  inline/                           # in-post screenshots (e.g. competitor-matomo.png)
```

### 6.2 Routing (URL structure, dynamic segments, locale handling)

- **List page:** `/[locale]/blog` → `dashboard/src/app/[locale]/(public)/blog/page.tsx`. With `localePrefix: 'as-needed'` this resolves to `/blog` for the default locale and `/da/blog`, `/it/blog`, `/nb/blog` otherwise. Already works through existing middleware matcher.
- **Post page:** `/[locale]/blog/[slug]` → `dashboard/src/app/[locale]/(public)/blog/[slug]/page.tsx`. `generateStaticParams()` returns the cartesian product of `SUPPORTED_LANGUAGES × postSlugs(locale)` — but for v1, posts are English-only, so we generate static params only for `locale: 'en'` and rely on the i18n redirect / 404 for other locales. Subsequent locales added per-post via per-locale frontmatter files.
- **No locale collisions:** the existing middleware matcher `/((?!api|_next|.*\\..*|dashboard|dashboards|billing).*)` (`dashboard/src/middleware.ts:17`) does not exclude `blog`, so `next-intl` will correctly route both `/blog/...` and `/it/blog/...`.
- **Slug collisions:** post slugs must not collide with reserved segments. v1 reserves slugs: `feed.xml`, `index`, `tag`, `tags`, `archive`, `page`. Enforce via Zod refinement in the frontmatter schema.

### 6.3 MDX/markdown pipeline

**Choice: `next-mdx-remote` (RSC-compatible variant) + `gray-matter` for frontmatter.** Reasons:

- Works in React Server Components without a custom Webpack/Turbopack loader. The dashboard already runs on Turbopack (`next dev --turbopack`) and we want to stay there.
- `@next/mdx` and `contentlayer` are heavier; `velite` is great but overkill for v1.
- `next-mdx-remote/rsc` lets us use the existing `mdx-components.tsx` pattern (which docs uses) without forking the dashboard build pipeline.

**Plugins:**

- `remark-gfm` — GitHub-flavored markdown, gives us tables (the draft has two of them).
- `remark-smartypants` — typographic punctuation for marketing tone.
- `rehype-slug` — heading IDs for in-page anchors.
- `rehype-autolink-headings` — anchor links on H2/H3 (matches PostHog/Plausible blog UX).
- `shiki` (or `rehype-pretty-code`) — syntax highlighting for any code blocks. Phase 2 if no posts need code; the EU-GA draft has none.

**MDX components to register:**

- `a` → custom `Link` that internal-detects `/features|/pricing|/vs/...` and uses `next-intl`'s `<Link>`; external links get `target="_blank" rel="noopener noreferrer nofollow"` and an icon.
- `img` → `next/image` wrapper. Handles the placeholder pattern from the draft (`![placeholder-screenshot-matomo.png](placeholder-screenshot-matomo.png)`) by resolving relative paths against `/blog/inline/` and passing through `priority` for the cover image.
- `table`, `thead`, `tbody`, `tr`, `th`, `td` — Tailwind-styled wrappers matching the existing `ComparisonTable` look. Or render markdown tables into `ComparisonTable` for the "At a glance" section via a custom MDX component.
- `pre`, `code` — pretty code blocks.
- `blockquote` — already styled in `(public)/about/page.tsx:118-122`; reuse that look.
- Custom: `<Callout type="info|warning">`, `<FAQ>` wrapping `<details>` items and emitting FAQPage JSON-LD, `<RelatedPosts slugs={[...]} />`, `<Cta variant="signup|pricing" />` (re-exporting `CtaStrip`).

### 6.4 Frontmatter schema (Zod-validated)

```ts
// dashboard/src/content/blog/schema.ts
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '@/constants/i18n';

const RESERVED_SLUGS = ['feed.xml', 'index', 'tag', 'tags', 'archive', 'page'];

export const blogFrontmatterSchema = z.object({
  title: z.string().min(10).max(80),
  description: z.string().min(50).max(160), // meta description guardrail
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .refine((s) => !RESERVED_SLUGS.includes(s), 'reserved slug'),
  publishedAt: z.string().datetime(),       // ISO 8601
  updatedAt: z.string().datetime().optional(),
  author: z.string(),                       // key into authors registry
  tags: z.array(z.string()).max(6).default([]),
  coverImage: z.object({
    src: z.string(),                        // /blog/cover/eu-alternatives.jpg
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  ogImage: z.string().optional(),           // overrides coverImage for OG; defaults to coverImage
  locale: z.enum(SUPPORTED_LANGUAGES).default('en'),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  // Article schema enrichment
  keywords: z.array(z.string()).min(3).max(15),
  // Optional FAQs surfaced in <FAQ> MDX block; if non-empty, emit FAQPage JSON-LD
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  // External citations (sources block at the bottom of the post)
  citations: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .default([]),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
```

**Build-time validation:** the registry (`dashboard/src/content/blog/registry.ts`) does `fs.readdirSync` over `posts/`, parses frontmatter via `gray-matter`, runs each through `blogFrontmatterSchema.parse()`, and exports a typed `Post[]`. Failure throws at import time → build fails. `draft: true` posts are filtered out unless `process.env.NEXT_PUBLIC_BLOG_DRAFTS === '1'`.

### 6.5 SEO

Extend `dashboard/src/lib/seo.ts`:

1. **New SEO_CONFIGS entry** `blogIndex: { namespace: 'public.blog.seo', path: '/blog', structuredDataType: 'website' }` (uses existing translation flow once we add `public.blog.seo.{title,description,keywords}` to the four locale JSONs).
2. **New helper `generateBlogPostSEO(post, { locale })`** that:
   - Passes through `generateSEO()` for the basics.
   - Overrides `openGraph.type = 'article'`, sets `openGraph.article = { publishedTime, modifiedTime, authors, tags }`.
   - Overrides `images` to use `post.ogImage ?? post.coverImage.src` resolved against `BASE_URL`.
3. **Extend `generateStructuredData`** with two new types:
   - `case 'article'` → `BlogPosting` JSON-LD: `headline`, `description`, `image`, `author`, `publisher`, `datePublished`, `dateModified`, `mainEntityOfPage`, `keywords`, `inLanguage`. The blog post page renders **two** `<StructuredData>` tags: one for the article, one for FAQPage if the post has `faqs.length > 0`.
   - `case 'faqPage'` → `FAQPage` JSON-LD with `mainEntity: post.faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))`.
4. **Sitemap injection** in `dashboard/src/app/sitemap.ts` — add a `getBlogPages()` helper that maps `registry.posts` to `PageCfg` entries with `localized: true`, `priority: 0.7`, `changeFrequency: 'monthly'`. Then `const PAGES = [...STATIC_PAGES, ...getComparisonPages(), ...getBlogPages()]`. Plus a single `/blog` index entry.
5. **Canonical URLs:** existing `generateSEO()` already builds `alternates.canonical`. For blog posts, the canonical is `${BASE_URL}/blog/${slug}` for the default locale and `${BASE_URL}/${locale}/blog/${slug}` otherwise — drops out of the existing `localizedPath` logic.

### 6.6 Listing page (`/blog`)

v1 (minimum):

- Hero: eyebrow ("Articles"), H1 ("The Betterlytics blog"), one-line description.
- Single column of `BlogPostCard` (cover image, eyebrow tag, title, description, author + date + reading time). Sorted by `publishedAt` desc.
- No pagination v1 (we have one post). Add pagination at 20+ posts via `?page=2` query param.
- Featured post (`featured: true`) gets a 2x card slot at top.
- Renders `<StructuredData>` with `WebSite` JSON-LD plus a `Blog` schema (extend `generateStructuredData` with `case 'blog'`).

Defer to Phase 2:

- Tag filtering: `/blog/tag/[tag]` (collect tags from registry, generate static params).
- Search: skip for v1; once we're at 20+ posts, either Algolia DocSearch or a simple client-side `fuse.js` index.

### 6.7 Single post page (`/blog/[slug]`)

Rendering order:

1. `BlogPostHeader` — eyebrow tag, H1, author + date + reading time, cover image (`next/image`, `priority`).
2. `BlogPostBody` — MDX content rendered through `MDXRemote`.
3. `BlogPostFooter` — sources/citations list (rendered from frontmatter `citations`), `<RelatedPosts>` (Phase 2: hand-curated `relatedSlugs` in frontmatter; for v1 just CTA), `<CtaStrip>` reused from existing component.
4. Two `<StructuredData>` tags: `Article`/`BlogPosting` always, `FAQPage` if `faqs.length > 0`.
5. (Optional v1, recommended Phase 1.5) `BlogTOC` — sticky right rail showing H2/H3 from MDX.

Reading time: simple `Math.ceil(markdownText.split(/\s+/).length / 220)` computed at registry build time and stashed in the post object.

### 6.8 RSS feed (`/blog/feed.xml`)

Phase 2. Implement as a Next route handler at `dashboard/src/app/[locale]/(public)/blog/feed.xml/route.ts` returning `Content-Type: application/rss+xml`. Build the feed from `registry.posts` for the requested locale; for default locale, also expose at `/feed.xml` (top-level redirect). Reference the feed in the public layout `<head>` via `<link rel="alternate" type="application/rss+xml">` injected by `generateMetadata` for `/blog` and `/blog/[slug]`.

### 6.9 Image handling

- **Cover images:** `public/blog/cover/<slug>.<ext>`. Always 1200×630 (matches OG). Render via `next/image` with `priority` on post page, lazy on list page.
- **In-post images:** the draft uses `![placeholder-screenshot-matomo.png](placeholder-screenshot-matomo.png)`. Convention: relative paths in MDX resolve against `/blog/inline/<post-slug>/<filename>`. The custom `img` MDX component handles that resolution — the author writes the relative filename, we prefix at render time. Width/height required (use `image-size` at build time or specify in the MDX `<Image>` component when finer control is needed).
- **OG image fallback:** if no `coverImage` is set, generate via a `/api/og?title=...&category=blog` route copied from `docs/src/app/api/og`. Defer this to Phase 2; v1 ships hand-authored cover images.

### 6.10 Internal linking

The custom `a` component in `dashboard/src/content/blog/mdx-components.tsx` distinguishes:

- **Internal dashboard links** (`/features`, `/pricing`, `/vs/*`, `/dpa`, `/privacy`, `/about`, `/changelog`, `/blog/*`, `/signup`, `/signin`): rendered with `<Link>` from `@/i18n/navigation`, locale-aware. Prefetched.
- **Internal docs links** (`/docs/*`): rendered with `next/link` (no locale prefix — docs has no locales). Same origin so works fine.
- **External links** (everything else): `<a target="_blank" rel="noopener noreferrer">` with an external-link icon. Add `nofollow` for citation links to authority sites the post does not endorse, but **not** for noyb/EDPB/CNIL etc. — those are trust signals we want Google to see.

### 6.11 Migration path for the existing draft

The draft `BLOG_DRAFT_EU_GA_ALTERNATIVES.md` (on `task/blog-eu-ga-alternatives`) is mostly publication-ready markdown. Steps:

1. Cherry-pick / read the "## 3. The draft post" section starting from `# Top 10 EU Alternatives to Google Analytics (2026)`. That is the post body. Strip sections 1, 2, 4, 5 (playbook, SEO strategy, open questions, sources) — they are research notes.
2. Convert the **Sources** section (section 5 of the draft) into the `citations` frontmatter array.
3. Convert the **"How to migrate from GA4"** section + the existing inline FAQ-like content into a `<FAQ>` MDX block at the bottom of the post and populate `frontmatter.faqs` so it emits FAQPage JSON-LD.
4. Replace each `![placeholder-screenshot-X.png](placeholder-screenshot-X.png)` with a real image at `public/blog/inline/eu-alternatives-to-google-analytics/<vendor>.png`. v1 ship-blocker: capture 10 screenshots. If we need to ship before screenshots, gate the `<img>` MDX component to render a `bg-muted` placeholder with the alt text.
5. Promote internal links (`/features`, `/pricing`, `/vs/plausible`, `/vs/matomo`, `/vs/umami`, `/vs/posthog`, `/vs/fathom-analytics`, `/vs/google-analytics`, `/dpa`, `/privacy`) — they are already in the draft as bare paths; the custom `a` component handles them.
6. Build the frontmatter from the draft's preamble (title, slug, meta description, OG title) plus `keywords` from section 2's keyword cluster. Initial frontmatter for the EU-GA post:

```yaml
---
title: 'Top 10 EU Alternatives to Google Analytics (2026)'
description: 'GDPR-compliant, EU-hosted analytics that replace GA4 — without cookie banners. We compare the 10 best European Google Analytics alternatives for 2026.'
slug: 'eu-alternatives-to-google-analytics'
publishedAt: '2026-05-01T00:00:00Z'
author: 'team'
tags: ['privacy', 'gdpr', 'comparisons']
coverImage:
  src: '/blog/cover/eu-alternatives-to-google-analytics.jpg'
  alt: 'European Union flag with analytics charts overlay'
  width: 1200
  height: 630
locale: 'en'
draft: false
featured: true
keywords:
  - 'EU alternatives to Google Analytics'
  - 'GDPR-compliant Google Analytics alternative'
  - 'EU-hosted privacy analytics for SaaS'
  - 'cookieless web analytics for EU companies'
  - 'Google Analytics 4 alternative without cookies'
  - 'privacy-first analytics tool EU'
  - 'is Google Analytics legal in the EU'
  - 'Schrems II Google Analytics'
  - 'best GA alternative for European business'
faqs:
  - q: 'Is Google Analytics legal in the EU?'
    a: '...'
  - q: 'How do I migrate from GA4 to a privacy-first tool?'
    a: '...'
  - q: 'What is cookieless analytics?'
    a: '...'
citations:
  - label: 'noyb — Austrian DSB ruling on Google Analytics'
    url: 'https://noyb.eu/en/austrian-dsb-eu-us-data-transfers-google-analytics-illegal'
  # …rest from draft section 5
---
```

7. Verify the eight unverified claims listed in the draft's "Open questions" section before publish. Five are pricing/feature claims that need a quick browser check, one (Fathom EU isolation) needs an email to the vendor.

---

## 7. Risk register (codebase-specific)

1. **i18n routing for English-only posts.** v1 ships only `locale: 'en'`. If a user lands on `/da/blog/eu-alternatives-to-google-analytics`, the post does not exist for `da` and `next-intl` will 404. Mitigation: in `[slug]/page.tsx` `generateStaticParams()`, generate only the slugs that exist for the requested locale; for missing locales, also pre-render a redirect to the English version (or a "Not yet translated" stub with a link to English). This requires a per-locale post lookup in the registry.
2. **Sitemap hreflang for non-localized posts.** `sitemap.ts:99-104` adds `alternates: { languages }` for every entry where `localized: true`. If we mark blog posts as localized but only English exists, hreflang will point all four locales at the same English URL — which is what Google wants when no translation exists, but only if `x-default` is also set. Confirm `seo.ts:36` already does `languages['x-default'] = path` (it does). Risk: low.
3. **`(public)/layout.tsx` wraps every blog page with `PublicTopBar` + `Footer` + `ThemeToggleFab`.** That's a feature, not a bug — but the right-rail TOC (Phase 1.5) needs a wider container than the existing `container mx-auto max-w-5xl` used by `/about`. Plan: blog posts use `max-w-7xl` with a `[grid-cols:minmax(0,_1fr)_280px]` desktop layout (article + sticky TOC). Mitigation handled in `BlogPostBody`.
4. **`next-intl` middleware path matching.** The matcher does NOT currently exclude `blog` — good, it will be locale-aware. But it also doesn't exclude `feed.xml`. If we ship `/blog/feed.xml` as a route handler, `next-intl` middleware will try to inject a locale prefix and rewrite to `/en/blog/feed.xml`. Mitigation: extend the matcher to exclude `feed.xml` (`'/((?!api|_next|.*\\..*|dashboard|dashboards|billing|.*feed\\.xml).*)'`) OR put the feed at `/api/blog/feed.xml` as a route handler under `/api`, which the matcher already excludes. Pick the latter — simpler.
5. **`StructuredData` extension assumption.** `seo.ts` uses a `switch (config.structuredDataType)` exhaustively typed against the `'organization' | 'website' | 'webpage' | 'contact'` literal union (`seo.ts:14`). Adding `'article' | 'blog' | 'faqPage'` requires updating that union *and* every consumer that imports `SEOConfig`. Grep showed 18 consumers — the addition is purely additive (existing consumers keep using existing literals), but TypeScript will require the switch to remain exhaustive. Mitigation: keep `default: return null` fallback, which `seo.ts:248` already does.
6. **Tailwind v4 typography plugin.** The dashboard uses Tailwind v4 (`tailwindcss: "^4"` in `dashboard/package.json:138`). Tailwind v4 doesn't auto-include `@tailwindcss/typography`; the changelog renderer hand-rolled prose styles via inline arbitrary selectors (see the long class on `ChangelogEntryCard.tsx:33`). For blog posts, either (a) add `@tailwindcss/typography` v4 (preview release) or (b) extract the changelog inline-prose pattern into a shared `prose-blog` component class. v1: option (b) — copy the existing pattern, no new deps.
7. **`next-mdx-remote` and Turbopack.** `next-mdx-remote/rsc` works under Turbopack as of v5.x (verify against current dashboard Next 15.4.11). If a Turbopack regression bites, fallback is `react-markdown` + `remark-gfm` for the v1 post (which has no MDX-only features — it's pure markdown with a few image placeholders). Risk: low, but pin to a known-working version.
8. **`generateStaticParams()` cardinality.** `[locale] × [slug]` grows multiplicatively. With 4 locales and (say) 30 posts that's 120 static paths. Fine. The `vs/[competitor]` page already does the cartesian product (`page.tsx:33-38`) so the pattern is proven.
9. **Footer drift between docs and dashboard.** Already a problem (the docs footer hardcodes dashboard URLs). Putting the blog on dashboard does not fix it but does not make it worse. Note for follow-up: extract `Footer` into a shared `@betterlytics/marketing-ui` package — out of scope for this task.
10. **Cross-app prefetching from docs to dashboard.** Out of scope but worth noting: links from `docs/*` to `/blog/*` on the dashboard side are full-page navigations. Not a blocker for the blog itself, but if we ever want a "Read on the blog" cross-link from a docs page, it costs prefetching. Not a regression vs. today.

---

## 8. Phased rollout

**Phase 1 — v1 minimum viable (ship one post, learn).** Target: 1 engineer, 2 days.

- Add `next-mdx-remote`, `gray-matter`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `reading-time` to `dashboard/package.json`.
- Build the registry (`dashboard/src/content/blog/registry.ts`), Zod schema (`schema.ts`), authors registry (`authors/team.ts`), MDX components (`mdx-components.tsx`).
- Build the index and slug pages (`/blog`, `/blog/[slug]`).
- Extend `seo.ts` with `article` + `faqPage` structured data + `generateBlogPostSEO`.
- Extend `sitemap.ts` with `getBlogPages()`.
- Add `public.blog.seo.{title,description,keywords}` to `messages/{en,da,it,nb}.json` (English copy in all four; localize later).
- Migrate the EU-GA draft into `posts/2026-05-01-eu-alternatives-to-google-analytics.mdx` with frontmatter, replace placeholders with real screenshots, fact-check the eight open questions from draft section 4.
- **Verification gate before publish:** lint passes, `pnpm build` passes, `/blog` and `/blog/eu-alternatives-to-google-analytics` render with `PublicTopBar` + `Footer` + working `<Link>` to `/features`/`/pricing`/`/vs/plausible`. Both Article and FAQPage JSON-LD validate at https://validator.schema.org. Sitemap includes the post. Lighthouse SEO score ≥ 95 on the post page.

**Phase 2 — polish (after one or two posts are live).** Target: 1 engineer, 1–2 days.

- RSS feed at `/api/blog/feed.xml` (route handler).
- Tag filtering (`/blog/tag/[tag]`).
- Right-rail sticky TOC with active-section highlight.
- Per-post `relatedSlugs` frontmatter + `RelatedPosts` strip.
- OG image generator route copied from `docs/src/app/api/og` adapted for blog.
- "Subscribe" CTA wired to a newsletter input (out of scope what newsletter — track as separate task).

**Phase 3 — future / opportunistic.**

- Multi-locale posts. Keep schema ready (`*.{en,da,it,nb}.mdx` per slug); translate the EU-GA post to Danish first as a smoke test.
- Search. Once 20+ posts, evaluate `pagefind` (already used in docs — `docs/package.json:8`) vs Algolia DocSearch. Pagefind has zero infra cost and works for static content.
- "Last updated" mechanic: `updatedAt` already in schema; surface "Updated <date>" badge if `updatedAt > publishedAt + 30d`.
- Author pages (`/blog/author/[author]`).
- View-tracking via Betterlytics itself (eat your own dog food). The dashboard root layout already injects the analytics script (`dashboard/src/app/layout.tsx:50-61`); blog pages inherit it for free.
- Extract `Footer` and `seo.ts` into a shared `@betterlytics/marketing-ui` workspace package so the docs site can stop hand-rolling its own copy.

---

## 9. Open questions / things I couldn't verify

1. **How `betterlytics.io/docs` is actually routed in production.** Two separate Next standalone apps under one origin almost certainly means there's a reverse proxy somewhere — but no `nginx.conf` or `vercel.json` was found in the repo. Verified that the docs `next.config.mjs:18` sets `basePath: "/docs"` and that the dashboard middleware matcher (`dashboard/src/middleware.ts:17`) does *not* explicitly exclude `/docs`. The deploy-level routing layer (Vercel or similar) is the missing piece. Implication for this plan: the recommendation does not depend on knowing this exactly, since the blog goes on the dashboard side either way. But before Phase 2's RSS feed, verify the route handler at `/api/blog/feed.xml` will be served by the dashboard (it will — `/api/*` is excluded from middleware and is not under `/docs/*`).
2. **Whether the user wants posts to be locale-localized or English-only.** The plan accommodates both via `locale` frontmatter + the existing `next-intl` setup. v1 ships English-only; Phase 3 covers translation.
3. **Whether the existing PostHog-style FAQ block at the end of the draft post corresponds to the `faqs` frontmatter, or whether it's free MDX content.** The draft does not have a discrete FAQ section in the body — only the "How to migrate from GA4" walkthrough, which reads like prose, not Q&A. To populate `faqs` we either (a) extract three to five Q&A pairs from the migration walkthrough or (b) author a new FAQ block before publish. Recommend (b) — it lifts SERP performance via FAQPage rich result, and PostHog's competitor playbook (referenced in draft section 1) confirms this is the move.
4. **Whether `nextra-theme-blog` was ever evaluated.** It exists; this plan deliberately doesn't use it because of the layout/branding mismatch and the i18n gap, but if the user has a strong preference for "MDX-out-of-the-box" we can revisit by adding a second Nextra theme to the docs app (Nextra supports per-route themes). The maintenance cost case still favors dashboard.
5. **Tailwind v4 + `@tailwindcss/typography` compatibility.** Did not test. v1 plans to hand-roll prose styles (the changelog component pattern) to sidestep this. If we want the typography plugin, verify against the current Tailwind v4 release before adding.
6. **`next-mdx-remote/rsc` Turbopack stability on Next 15.4.11.** Plan assumes it works; verify in a smoke test before wiring. Fallback is `react-markdown` for v1 (the EU-GA post is pure markdown).
7. **Schema for the `coverImage` width/height.** Authors will hit this constraint. v1 enforces in Zod; if it becomes a friction point, switch to `image-size` library at build time (read dimensions from the file).
