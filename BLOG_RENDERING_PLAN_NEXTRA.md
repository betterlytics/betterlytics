# Blog Rendering Plan — Nextra-hosted (`/blog/<slug>`)

> **This document supersedes the recommendation in `BLOG_RENDERING_PLAN.md` per user override.** That earlier plan recommended hosting the blog in the dashboard Next.js app at `dashboard/src/app/[locale]/(public)/blog/`. The user has chosen the Nextra path instead: the blog will be authored and rendered through the existing `docs/` package (Nextra 4.6.x), v1 is **English-only** with no `next-intl` integration, and the public URL is **`/blog/<slug>`** at the site root — NOT nested under `/docs`. The comparison matrix, frontmatter schema, internal-link policy, and risk register from the prior plan are reused where they still apply; sections that depended on the dashboard-side path (locale routing, `seo.ts` extension, dashboard sitemap) are replaced.

---

## 1. Executive summary

- **Routing approach picked: Approach A — drop `basePath: "/docs"` from `docs/next.config.mjs:17` and restructure routing to `app/docs/[[...mdxPath]]/page.tsx` + `app/blog/[[...slug]]/page.tsx` in the same Next.js process.** Same standalone build, same deployment, same reverse-proxy target — but the proxy must now forward both `/docs/*` and `/blog/*` to the docs container. This is the only Nextra-native option that delivers the user's `/blog/<slug>` URL constraint while keeping a single Next process. (Alternatives B, C, D evaluated in §3.)
- **Reuse Nextra's MDX pipeline as-is** — `importPage()` + `nextra/page-map` + `nextra-theme-docs` already give us frontmatter parsing, GFM tables, autolinked headings, the `Wrapper` component, and TOC. The blog gets a *different* layout (no docs sidebar, marketing chrome) but the same renderer. Per §5, we use Nextra's `Layout` per-tree by branching at the `app/` segment.
- **The reverse-proxy update is the single biggest risk** and the one piece of infra change this plan cannot self-verify, because the production proxy config (nginx / Vercel / Caddy) is not in the repo. The blog cannot ship until that proxy is updated to forward `/blog/*` to the docs container. See §10.
- **Frontmatter schema is Zod-validated at build time**, slimmed from the prior plan to drop the `locale` enum and four-locale considerations. Same shape otherwise: `title`, `description`, `slug`, `publishedAt`, `author`, `tags`, `coverImage`, `keywords`, `faqs`, `citations`.
- **Internal links to `/features`, `/pricing`, `/vs/[competitor]`** stay same-origin (they all resolve at `betterlytics.io/<path>` against the dashboard app) and are rendered as plain `<Link href="/...">` from `next/link`. Cross-app navigation costs prefetching, same as today's docs footer (`docs/src/app/components/footer.tsx:23-67`) — that's a known trade-off, not a new problem.
- **Phase 1 ships one English post at `/blog/eu-alternatives-to-google-analytics`, the listing page at `/blog`, and `Article`+`FAQPage` JSON-LD. RSS, tag pages, and OG image generator are Phase 2. Translations are out of scope (Phase 3).**

---

## 2. Hard constraints (user overrides)

1. **Nextra-hosted.** Blog renders through the `docs/` package (Nextra 4.6.1 + nextra-theme-docs 4.6.1). No dashboard-side hosting. Verified versions in `docs/package.json:17-18`.
2. **URL: `/blog/<slug>`** at site root. Not `/docs/blog/<slug>`. This is non-negotiable and dictates the routing approach.
3. **Same Next.js process preferred.** Sibling apps allowed only with strong justification.
4. **English-only v1.** No `next-intl` integration. No `[locale]` segment. Defer translation infra to Phase 3.

---

## 3. Routing approach evaluation

### Constraint surface (current state)

- **`docs/next.config.mjs:15-18`** — `output: "standalone"`, `basePath: "/docs"`. The `basePath` is what makes everything land at `betterlytics.io/docs/*` today.
- **`docs/src/app/[[...mdxPath]]/page.tsx:1-77`** — single catch-all that calls `importPage(params.mdxPath)`. With `basePath: "/docs"`, content at `docs/src/content/installation/cloud-hosting.mdx` resolves to `/docs/installation/cloud-hosting`.
- **`docs/src/app/layout.tsx:128-137`** — root `<Layout>` from `nextra-theme-docs` wraps every page in the docs sidebar + nav + footer. There's no per-route layout split today.
- **`docs/src/lib/constants.ts:1-7`** — `DOCS_BASE_PATH = "/docs"` and `getAssetPath()` are used to prefix asset URLs (e.g., the OG route at `docs/src/app/api/og/route.tsx`).
- **Production routing:** there is **no reverse-proxy config in the repo.** I searched (`Glob` for `nginx*.conf`, `Caddyfile`, `vercel.json`, `*.yml`) and only found `docker-compose.yml:3-11` which spins up a *local-dev* nginx serving `/static`. The production proxy lives elsewhere (Vercel project config, an infra repo, or a hand-managed nginx). This is the same Open Question 1 from the prior plan (`BLOG_RENDERING_PLAN.md:372`) — unresolved here too. **Whichever approach we pick has a proxy-config implication that needs to be communicated to whoever owns that proxy.**
- **Dashboard middleware** — `dashboard/src/middleware.ts:17` matcher `/((?!api|_next|.*\\..*|dashboard|dashboards|billing).*)` does NOT exclude `/docs/*` or `/blog/*`. Today, `/docs/*` requests must therefore be intercepted by the proxy *before* hitting the dashboard process. Same will be true for `/blog/*`.

### Approach A — Drop `basePath`, restructure routing in the docs app

**What changes:**

- Delete `basePath: "/docs"` from `docs/next.config.mjs:17`.
- Move catch-all to `docs/src/app/docs/[[...mdxPath]]/page.tsx` (new path, same content).
- Add catch-all `docs/src/app/blog/[[...slug]]/page.tsx` (new content tree at `docs/src/content/blog/`).
- Move `docs/src/app/api/og/route.tsx` → `docs/src/app/docs/api/og/route.tsx` (or keep at `/api/og` and parameterize for both trees — preferable; see §8.3).
- Update `docs/src/lib/constants.ts:1-7` so `getAssetPath()` returns paths without the `/docs` prefix (or removes the helper entirely; `next/link` and asset imports don't need it once `basePath` is gone).
- Update `docs/src/app/layout.tsx` to branch the `<Layout>` choice based on URL — docs tree uses `nextra-theme-docs` `<Layout>` with sidebar, blog tree uses a custom marketing layout (no sidebar). See §5 for the layout mechanic — Nextra renders the chrome via the catch-all's `Wrapper` (`[[...mdxPath]]/page.tsx:64`), so the blog catch-all simply doesn't import `nextra-theme-docs`'s wrapper.
- Update existing absolute URL references inside content/components from `/docs/...` to `/docs/...` literals (no change needed — they were always literal `/docs/...` paths).

**Pros:**
- One Next.js process. Single build. Single deploy. Single CDN config. Single Nextra version.
- Reuses Nextra's MDX pipeline for blog content for free.
- Same-origin links between `/docs/*`, `/blog/*`, and dashboard pages — prefetching works inside the docs app for `/docs/*` ↔ `/blog/*` even if cross-app navigation to `/features` is still a hard nav.
- No new dependencies.

**Cons:**
- **Every existing `/docs/*` URL must continue to work** post-change. The route layout itself preserves them (catch-all simply moves from `app/[[...mdxPath]]/page.tsx` to `app/docs/[[...mdxPath]]/page.tsx`), but two follow-on items need attention: (1) `getAssetPath()` consumers in OG meta + favicons (`docs/src/app/[[...mdxPath]]/page.tsx:13-37`, `docs/src/app/layout.tsx:46-49`) need to be re-checked, (2) any hardcoded asset paths.
- **Reverse proxy must now forward `/blog/*` to the docs container** in addition to `/docs/*`. Without that change, `/blog/*` would hit the dashboard app, miss every route there, and 404. See §10.
- The docs site's deployment image (`docs/Dockerfile`) currently expects to be the `/docs` segment of the origin. Removing `basePath` doesn't change the Docker setup but does mean the proxy update is mandatory in lockstep with the deploy.
- Single-process means a build error in the blog tree breaks docs deployment, and vice-versa.

**What breaks if we don't update the proxy:** `/blog/*` returns the dashboard's 404 (the `next-intl` catch-all). `/docs/*` continues to work as before because the proxy's existing `/docs/*` rule still applies.

### Approach B — Keep `basePath: "/docs"`, spin up a sibling Next.js app for the blog

**What changes:**
- Leave `docs/` untouched.
- Create a new `blog/` package at the repo root, mirroring `docs/`'s structure, with its own `next.config.mjs` (`basePath: "/blog"`, `output: "standalone"`), its own Nextra setup, its own theme.
- Add a fourth Docker container (after `dashboard`, `docs`, and the analytics backend) for the blog. Reverse proxy fans out: `/dashboard/*`/etc. → dashboard, `/docs/*` → docs, `/blog/*` → blog, default → dashboard.

**Pros:**
- Zero risk to the existing docs deployment. `basePath: "/docs"` stays exactly as is.
- Independent build, deploy, version-bump cadences.
- Failure isolation — a blog build error doesn't block a docs release.

**Cons:**
- **Two Next apps to maintain for what is fundamentally similar content.** Theme drift is guaranteed over time (we already see this with the docs footer hardcoding URLs back to dashboard).
- One more container, one more pipeline, one more set of env vars, one more Nextra/theme upgrade target.
- The user explicitly asked for "optimally in the same folder/server if that makes sense" — this approach contradicts that preference without strong justification. The justification we'd need is "Approach A breaks production docs URLs" — and it doesn't, as long as the proxy update lands in lockstep.

### Approach C — Multi-zone with `assetPrefix` + `rewrites`

**What changes:**
- Keep `docs/` with `basePath: "/docs"`.
- Add a top-level Next.js app (in this case the dashboard would have to host it, OR a third app would). Configure its `rewrites()` to forward `/blog/*` to a separate blog Next app's origin via Next's multi-zone pattern.

**Pros:**
- Documented Next.js pattern (https://nextjs.org/docs/app/building-your-application/deploying/multi-zones).
- Each zone keeps its own `basePath`, no in-place restructure of docs.

**Cons:**
- **Multi-zones are designed to STITCH multiple Next apps into one origin via rewrites at one of them — but here we already have a reverse proxy fronting both apps.** Adding multi-zone rewrites on top of the proxy is redundant infrastructure and adds a hop. If the dashboard is the front zone, a `/blog/*` hit would go: client → proxy → dashboard → fetch via rewrite → blog app → response. That's worse than approach B.
- Multi-zone effectively becomes Approach B with extra rewrite plumbing in front. No benefit over B for our setup.
- Nextra 4 is not documented as multi-zone-aware; risk of subtle interactions with `getPageMap()` and `importPage()`.

### Approach D — Nextra-native multiple top-level content trees in one app

**What I checked:** Nextra 4's `importPage()` (https://nextra.site/api/importpage) takes only `pathSegments` and `lang` — it always reads from a single `content/` directory. There is no `multiple content roots` feature. However, **the `content/` directory DOES support nested folders that map directly to URL segments** — i.e., `content/docs/...` and `content/blog/...` would naturally produce `/docs/*` and `/blog/*` from a single catch-all with `basePath` removed.

So "Approach D" collapses into Approach A: the way Nextra 4 supports multiple content trees in one app is exactly to put them as sibling folders under `content/` and let folder structure drive URLs. There's also a `contentDirBasePath` option in Nextra (https://nextra.site/docs/file-conventions/content-directory) for changing the URL prefix relative to file structure, but it's a single value; it doesn't support per-tree prefixes.

**Hybrid worth noting:** keep all content in a single catch-all at `app/[[...mdxPath]]/page.tsx` (no per-tree split), drop `basePath`, and place blog content at `docs/src/content/blog/...` so it naturally resolves to `/blog/...`. The advantage: less file movement than Approach A. The disadvantage: a single `<Wrapper>` component (the Nextra theme layout) renders both docs AND blog, so we lose the ability to give blog posts a distinct marketing-chrome layout without conditional rendering inside the wrapper. Doable but messy. Approach A's separate catch-alls (one per tree) is cleaner because each can pick its own layout / Nextra theme / metadata pipeline.

### Recommendation: **Approach A**

| Axis | A: drop basePath, two catch-alls | B: sibling Next app | C: multi-zone | D: native multi-root |
|---|---|---|---|---|
| User constraint: same Next process | Yes | No | Two processes | Yes |
| User constraint: `/blog/<slug>` URL | Yes | Yes | Yes | Yes (collapses to A) |
| Reuses Nextra MDX pipeline | Yes | Yes (separate copy) | Yes | Yes |
| Per-tree layout (docs sidebar vs marketing chrome) | Yes (separate `<Wrapper>` per catch-all) | Yes | Yes | Hard (single wrapper) |
| Zero risk to existing `/docs/*` URLs | Requires care + proxy update | Yes | Yes | Requires care + proxy update |
| Reverse-proxy change required | Yes (add `/blog/*` route) | Yes (add `/blog/*` route to a new container) | Yes (add `/blog/*` route to whichever zone) | Yes (add `/blog/*` route) |
| Build/deploy complexity | Low | High | High | Low |
| Maintenance cost | Lowest | Highest | High | Low (but layout fight) |

Approach A wins on every axis except "zero risk to existing `/docs/*` URLs," and that risk is mitigated by keeping the file move atomic and gated behind a smoke test (§13 phase 1 verification gate). The proxy update lands in the same change window.

---

## 4. File structure under Approach A

```
docs/
  next.config.mjs                          # basePath removed
  src/
    app/
      layout.tsx                           # root layout — minimal (html/body/Head/Script)
      docs/
        [[...mdxPath]]/
          page.tsx                         # MOVED from src/app/[[...mdxPath]]/page.tsx
        api/og/
          route.tsx                        # MOVED from src/app/api/og/route.tsx
                                           # OR kept top-level and parameterized — see §8.3
        layout.tsx                         # docs-tree layout: Nextra Layout + sidebar + docs Footer
      blog/
        [[...slug]]/
          page.tsx                         # NEW — renders blog posts via importPage('blog', ...slug)
          opengraph-image.tsx              # OPTIONAL — Phase 2
        page.tsx                           # NEW — /blog index (post list)
        feed.xml/
          route.ts                         # Phase 2 — RSS
        layout.tsx                         # blog-tree layout: marketing chrome (no docs sidebar)
        components/
          BlogPostHeader.tsx               # title, eyebrow, author, date, reading time
          BlogPostFooter.tsx               # citations, CTA, related posts
          BlogPostCard.tsx                 # listing tile
          BlogIndexHero.tsx                # /blog hero
          BlogFAQ.tsx                      # MDX <FAQ> wrapper, emits FAQPage JSON-LD
          BlogStructuredData.tsx           # Article + FAQPage JSON-LD generator
        lib/
          schema.ts                        # Zod frontmatter schema
          registry.ts                      # build-time post index (reads /content/blog/*.mdx)
          authors.ts                       # author metadata (name, role, avatar)
          rss.ts                           # Phase 2 — RSS XML builder
          seo.ts                           # blog-specific Metadata helpers
    content/
      index.mdx                            # docs root (was /docs root, now /docs/ root)
      faq.mdx
      installation/...
      integration/...
      dashboard/...
      pricing/...
      blog/                                # NEW
        eu-alternatives-to-google-analytics.mdx
        # future posts here
        _meta.js                           # NEW — Nextra page-map override (see §5)
    lib/
      constants.ts                         # DOCS_BASE_PATH simplified or removed
    mdx-components.js                      # extended with blog-only components
  public/
    blog/
      cover/                               # 1200x630 cover images
      inline/                              # in-post screenshots
      og/                                  # static OG fallbacks (until Phase 2 generator)
```

**Notes:**

- The `app/docs/layout.tsx` and `app/blog/layout.tsx` segment layouts let us pick different chrome per tree without conditional rendering inside a shared wrapper. The root `app/layout.tsx` becomes minimal (just `<html>`, `<body>`, the analytics `<Script>` block from current `docs/src/app/layout.tsx:118-127`, and any global `<Head>`).
- `content/blog/_meta.js` controls the post ordering and visibility for the listing page if we choose to drive it from Nextra's page map. Alternative: use the registry (`app/blog/lib/registry.ts`) as the source of truth and ignore Nextra's page map for the blog tree. **Recommend the registry path** — it's explicit, Zod-validated, and decoupled from Nextra's docs-shaped expectations. The `_meta.js` would only need an entry to keep blog files from polluting the docs sidebar (see §5.3).

---

## 5. Nextra / MDX pipeline decisions

### 5.1 Reuse Nextra's `importPage` for blog content

Nextra 4's `importPage(pathSegments)` reads from `content/<pathSegments>.mdx`. With `basePath` removed and content placed at `content/blog/<slug>.mdx`, `importPage(['blog', slug])` returns the same `{ default, toc, metadata }` triple it does for docs. Frontmatter parsing, GFM tables, autolinked headings, code blocks come for free. Source: https://nextra.site/api/importpage.

This means **no parallel MDX pipeline (no `next-mdx-remote`, no `react-markdown`).** Single renderer, single set of remark/rehype plugins, fewer moving parts than the prior plan's dashboard-side pipeline.

### 5.2 Custom layout for the blog tree (no docs sidebar)

The current root layout at `docs/src/app/layout.tsx:128-137` always renders `nextra-theme-docs` `<Layout>` with sidebar and TOC. For the blog tree we want marketing chrome. Implementation:

- `app/layout.tsx` becomes minimal — `<html>`, `<body>`, `<Head>`, the analytics `<Script>` block, the `WebSite` JSON-LD that's currently inline (lines 99-115), and `<NextTopLoader>`.
- `app/docs/layout.tsx` imports `nextra-theme-docs` `<Layout>` and renders the sidebar + nav + docs footer. This is essentially a port of the current root layout.
- `app/blog/layout.tsx` imports a different chrome — a marketing-style header (logo + nav links + "To Dashboard" CTA, similar to `docs/src/app/layout.tsx:53-83` but slimmed) and the existing docs `Footer` (`docs/src/app/components/footer.tsx`) since it already has the marketing-shaped link list.

### 5.3 Hide the blog tree from the docs sidebar

Even if the docs catch-all only resolves URLs like `/docs/*`, Nextra's `getPageMap()` at `app/docs/layout.tsx` reads ALL of `content/`. To prevent `content/blog/*` from polluting the docs sidebar, add `content/_meta.js` (or extend the existing one at `docs/src/content/_meta.js:1-9`) with `blog: { display: 'hidden' }` (Nextra page-map convention). Verify against current Nextra docs but this pattern is well-established.

### 5.4 MDX components to register for the blog tree

Most components blog posts need are already in `nextra-theme-docs`'s `useMDXComponents()` (autolinked headings, code blocks, tables, etc.). Extend `docs/src/mdx-components.js:14-24` with blog-specific ones:

- `<FAQ items={[...]} />` — renders `<details>` accordion AND emits FAQPage JSON-LD via `BlogStructuredData` (rendered as a sibling).
- `<Cta href="..." variant="signup|pricing" />` — end-of-post CTA. Reuses the docs site's `ExternalLink` component since "To Dashboard" is cross-app.
- `<Callout type="info|warning">` — already exists in `nextra/components` (https://nextra.site/docs/built-ins/callout). Just register / re-export.
- Custom `<a>` is NOT overridden globally — Nextra theme already auto-detects external vs internal. Internal links in a blog post like `[features](/features)` resolve as `<Link href="/features">`, prefetched within the docs Next app (which still won't help since `/features` is on the dashboard app — that's a hard nav, see §10 internal-links discussion). This is the same constraint that applies to today's docs footer.

### 5.5 Reading time

Computed at registry build time: `Math.ceil(rawMarkdown.split(/\s+/).length / 220)`. Stashed on the post object and rendered in `BlogPostHeader`. No new dependency.

---

## 6. Frontmatter schema (Zod)

Slimmed from `BLOG_RENDERING_PLAN.md:165-200` — removed `locale` (English-only v1), removed any per-locale path logic.

```ts
// docs/src/app/blog/lib/schema.ts
import { z } from 'zod';

const RESERVED_SLUGS = ['feed.xml', 'index', 'tag', 'tags', 'archive', 'page'];

export const blogFrontmatterSchema = z.object({
  title: z.string().min(10).max(80),
  description: z.string().min(50).max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .refine((s) => !RESERVED_SLUGS.includes(s), 'reserved slug'),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  author: z.string(),
  tags: z.array(z.string()).max(6).default([]),
  coverImage: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).min(3).max(15),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  citations: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .default([]),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
```

Validation:
- The registry at `app/blog/lib/registry.ts` reads `content/blog/*.mdx`, parses frontmatter via Nextra's `importPage` (which already returns `metadata`), validates each through `blogFrontmatterSchema.parse()`, fails the build on schema violation.
- `draft: true` posts filtered out unless `process.env.NEXT_PUBLIC_BLOG_DRAFTS === '1'`.
- Slug derivation: prefer the `slug` frontmatter field; fall back to filename without extension.

`zod` is already a dep in `docs/package.json:22`. No new install needed.

---

## 7. Listing page (`/blog`)

`docs/src/app/blog/page.tsx` (NOT the catch-all — the literal `page.tsx` at the segment root takes precedence).

**v1:**

- Hero: eyebrow "Articles", H1 "The Betterlytics blog", one-line description.
- Single column of `BlogPostCard` (cover image, eyebrow tag, title, description, author + date + reading time). Sorted by `publishedAt` desc.
- Featured posts (`featured: true`) get a 2x card slot at top.
- No pagination v1 (one post). Add at 20+ posts via `?page=2`.
- `BlogStructuredData` emits `WebSite` + `Blog` JSON-LD on the index.

**Source of truth:** `app/blog/lib/registry.ts` — synchronously enumerates `content/blog/*.mdx` at build, parses via `importPage`, validates, sorts, exports `Post[]`. The listing page does `const posts = await getBlogPosts()` and maps over them.

**Defer to Phase 2:**
- Tag filtering page `/blog/tag/[tag]` (Nextra catch-all interaction: the `[[...slug]]` blog catch-all would intercept `/blog/tag/<x>` unless `tag/[tag]/page.tsx` is registered as a sibling — Next.js segment specificity handles this naturally).
- Search.
- Author pages.

---

## 8. SEO + structured data plan

### 8.1 Metadata generation

Per-post `generateMetadata` in `app/blog/[[...slug]]/page.tsx` builds a Next `Metadata` object directly (we do NOT cross into the dashboard's `seo.ts`). Pattern mirrors the existing docs metadata at `docs/src/app/[[...mdxPath]]/page.tsx:7-62`:

- `title`: `${post.title} | Betterlytics Blog`
- `description`: `post.description`
- `alternates.canonical`: `https://betterlytics.io/blog/${post.slug}` (absolute — `metadataBase` already set in `docs/src/app/layout.tsx:19` to `https://betterlytics.io`).
- `openGraph.type = 'article'`, `openGraph.url`, `openGraph.publishedTime`, `openGraph.modifiedTime`, `openGraph.authors = [post.author]`, `openGraph.tags = post.tags`, `openGraph.images = [{ url: post.ogImage ?? post.coverImage.src, width: 1200, height: 630, alt: post.title }]`.
- `twitter.card = 'summary_large_image'`, `twitter.images = [...]`.

### 8.2 Structured data

`BlogStructuredData.tsx` is a tiny server component that injects `<script type="application/ld+json">` (same shape as the inline block at `docs/src/app/layout.tsx:99-115`). It supports two types:

- **`Article` / `BlogPosting`** — always emitted on `/blog/<slug>` pages: `headline`, `description`, `image`, `author`, `publisher: { '@type': 'Organization', name: 'Betterlytics', logo: 'https://betterlytics.io/betterlytics-logo-full-light.png' }`, `datePublished`, `dateModified`, `mainEntityOfPage`, `keywords`, `inLanguage: 'en'`.
- **`FAQPage`** — emitted only when `post.faqs.length > 0`. Sibling `<script>` tag.

Listing page emits `WebSite` + `Blog` schema.

### 8.3 OG image generator

Two options:

- **(a) Reuse the existing `/api/og` route** at `docs/src/app/api/og/route.tsx`. Add a `?type=blog` parameter and re-style the badge from "Docs" to "Blog" or strip it. Move the route to `app/api/og/route.tsx` (top-level, not nested under `/docs`) so both trees can hit it. This is the cleanest path and only requires touching the badge text logic at `docs/src/app/api/og/route.tsx:122-139`.
- **(b) Hand-author cover images** for v1 (`public/blog/cover/<slug>.jpg`) and skip the dynamic generator.

Recommend (b) for v1 (one post, hand-authored), (a) for Phase 2.

### 8.4 Sitemap — the harder problem

Today the dashboard's `dashboard/src/app/sitemap.ts:29-54` hardcodes the docs URL list as non-localized entries. This is fragile but it works.

**For the blog under Approach A:**

- The blog URLs (`/blog`, `/blog/<slug>`, `/blog/tag/<tag>` future) need to appear in *some* sitemap that Google can find.
- The robots.txt at `dashboard/src/app/robots.ts:26` only points to `/sitemap.xml` — i.e., the dashboard's sitemap. There is no docs-side sitemap registered today.

**Two options:**

1. **Hardcode blog URLs into the dashboard sitemap** the same way docs URLs are hardcoded. Add a new section after `STATIC_PAGES` (`dashboard/src/app/sitemap.ts:13-54`) listing `/blog` and each post's URL with `localized: false`. Requires editing the dashboard whenever a post is added — same drift problem docs already has.
2. **Have the docs app expose its own sitemap at `/sitemap-blog.xml`** (or `/sitemap-docs-and-blog.xml`) and have the dashboard's `robots.ts` reference both. Concretely: add a `app/sitemap.ts` to the docs package that enumerates blog posts from the registry plus existing docs pages. Update `dashboard/src/app/robots.ts:26` to:
   ```ts
   sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/blog/sitemap.xml`],
   ```

**Recommend option 2** — it puts blog URLs next to the source of truth (the registry), eliminates drift, and is the one diff that adds the Nextra-side sitemap (file: `docs/src/app/sitemap.ts`, new) plus the `robots.ts` reference update on the dashboard side. Also worth doing the same for the existing docs URL list at `dashboard/src/app/sitemap.ts:29-54` as a follow-up — but that's out of scope for this task.

### 8.5 Robots

`dashboard/src/app/robots.ts:18-27` already allows `/` and disallows `/dashboard/*`, `/dashboards/*`, `/billing/*`, `/api/*`. `/blog/*` is allowed by default. No change needed except adding the second sitemap reference per §8.4.

### 8.6 Canonical URLs

All posts have a single canonical at `https://betterlytics.io/blog/<slug>`. No locale variants. No `hreflang` (English-only).

### 8.7 Internal links from blog posts to dashboard pages

The draft links to `/features`, `/pricing`, `/vs/plausible`, `/vs/matomo`, `/vs/umami`, `/vs/posthog`, `/vs/fathom-analytics`, `/vs/google-analytics`, `/dpa`, `/privacy`. All of these are **dashboard routes** but on the **same origin** (`betterlytics.io`).

In an MDX file, write them as plain markdown links: `[features](/features)`. Nextra renders as `<Link href="/features">`. At runtime:

- `<Link>` from `next/link` will issue a soft client-side navigation if the target is a route in the *current* Next app.
- Since `/features` is NOT a route in the docs/blog Next app, Next falls back to a hard navigation (full page load), which is what we want — it crosses to the dashboard app via the reverse proxy.

This is the same behavior as the docs footer today (`docs/src/app/components/footer.tsx:23-67`). Acceptable. Document it for content authors so they don't expect SPA-style navigation between blog posts and dashboard pages.

---

## 9. RSS feed (`/blog/feed.xml`)

**Phase 2.** Implement as a route handler at `docs/src/app/blog/feed.xml/route.ts`:

```ts
export async function GET() {
  const posts = await getBlogPosts();
  const xml = buildRssXml(posts); // app/blog/lib/rss.ts
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
```

Reference the feed via `<link rel="alternate" type="application/rss+xml" href="/blog/feed.xml" />` injected from `app/blog/layout.tsx`'s metadata.

**Middleware caveat from prior plan does not apply here.** The dashboard middleware's matcher exclusion logic is irrelevant under Approach A — `/blog/feed.xml` is served by the docs container, behind the proxy, which dispatches `/blog/*` directly. No `next-intl` interaction.

---

## 10. Reverse-proxy config implications

**This is the single biggest unknown and the gating dependency for the blog launch.**

What I know from the codebase:
- The repo has no production proxy config (`Glob` for `nginx.conf`, `Caddyfile`, `vercel.json` returned no matches).
- `docker-compose.yml:3-11` has only a local-dev nginx serving `./static` (the tracking script `analytics.js` and `replay.js`).
- `docs/Dockerfile:30` exposes the docs Next app on port `3002`.
- The dashboard middleware (`dashboard/src/middleware.ts:17`) does NOT exclude `/docs/*`, which means the proxy MUST already intercept `/docs/*` before it reaches the dashboard process.

What needs to happen for Approach A to ship:

1. Whichever component is fronting `betterlytics.io` (Vercel project routing, an nginx/Caddy in an infra repo, a hand-managed proxy) **must add a forwarding rule for `/blog/*` → docs container**, in addition to the existing `/docs/*` rule.
2. That same proxy must also forward the new docs-side sitemap path `/blog/sitemap.xml` (and optionally `/sitemap-blog.xml`) — same target (docs container).
3. Confirm the proxy does NOT strip the `/blog/` prefix when forwarding (Approach A does not use `basePath`, so the docs container expects to receive the literal `/blog/<slug>` path).
4. If the proxy is currently forwarding via path-based rules like `location /docs/ { proxy_pass http://docs:3002; }`, the analogous rule is `location /blog/ { proxy_pass http://docs:3002; }`. If the proxy is Vercel's project routing, this is a project-config change, not a code change.

**Concrete deliverable to whoever owns the proxy:**

> The `docs` Next.js standalone container will, after this change, also serve all `/blog/*` paths in addition to `/docs/*`. Update the production proxy to forward `/blog/*` (and `/blog/sitemap.xml` if not already covered by `/blog/*`) to the same backend that currently receives `/docs/*`. The `basePath: "/docs"` in `docs/next.config.mjs` will be removed in lockstep, so the docs container will expect the full original path (`/docs/...`, `/blog/...`) — no stripping of the prefix on either side.

Until this proxy update lands, the blog cannot launch. **Recommend wiring the proxy update first, deploying a smoke test (a "hello" `app/blog/page.tsx` that returns 200), then merging the rest of the implementation.**

---

## 11. Migration of the existing draft

Source: `BLOG_DRAFT_EU_GA_ALTERNATIVES.md` lines 88+ (the "## 3. The draft post" section onward — sections 1, 2, 4, 5 are research notes, not content).

**Destination:** `docs/src/content/blog/eu-alternatives-to-google-analytics.mdx`

**Concrete steps:**

1. Create `docs/src/content/blog/` directory.
2. Create `eu-alternatives-to-google-analytics.mdx` with frontmatter (English-only, no `locale` field):

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
    a: '...'  # Author 3-5 Q&As lifted/rewritten from draft section "How to migrate from GA4"
  - q: 'How do I migrate from GA4 to a privacy-first tool?'
    a: '...'
  - q: 'What is cookieless analytics?'
    a: '...'
citations:
  - label: 'noyb — Austrian DSB ruling on Google Analytics'
    url: 'https://noyb.eu/en/austrian-dsb-eu-us-data-transfers-google-analytics-illegal'
  # ...rest from draft section 5
---
```

3. Body: copy the markdown from `BLOG_DRAFT_EU_GA_ALTERNATIVES.md:99` onward. Strip the H1 (the layout will render it from frontmatter `title`).
4. Replace each `![placeholder-screenshot-X.png](placeholder-screenshot-X.png)` with paths like `![Matomo dashboard screenshot](/blog/inline/eu-alternatives-to-google-analytics/matomo.png)`. Capture 10 screenshots and place them under `docs/public/blog/inline/eu-alternatives-to-google-analytics/`. **Ship-blocker for v1.**
5. Replace the cover image placeholder with `docs/public/blog/cover/eu-alternatives-to-google-analytics.jpg` (1200x630).
6. Internal links — keep them as bare paths (`/features`, `/pricing`, `/vs/plausible`, etc.). Nextra renders them as `<Link>`; the proxy handles cross-app routing. See §8.7.
7. Convert sources/citations — the draft has them under section 5. Each source → one entry in the `citations` frontmatter array. The `BlogPostFooter` component renders them as a "Sources" section.
8. Convert the FAQ block — the draft does NOT have a discrete FAQ section in the body (per `BLOG_RENDERING_PLAN.md:374`), so we author 3-5 Q&As before publish, populate `faqs` frontmatter, and the body renders a `<FAQ items={frontmatter.faqs} />` block. FAQPage JSON-LD emits automatically.
9. Verify the eight unverified claims listed in the draft's section 4 (pricing/features for each competitor; Fathom EU isolation needs vendor confirmation).

---

## 12. Risk register (Nextra-path-specific, codebase-grounded)

1. **Reverse-proxy update is out-of-band.** Per §10. The blog cannot launch without the proxy forwarding `/blog/*` to the docs container. Mitigation: identify proxy owner first, ship the proxy change BEFORE the code change merges.
2. **`basePath` removal blast radius on existing `/docs/*` URLs.** Removing `basePath: "/docs"` from `docs/next.config.mjs:17` and moving the catch-all to `app/docs/[[...mdxPath]]/page.tsx` should preserve every URL — but `getAssetPath()` (`docs/src/lib/constants.ts:1-7`) currently prepends `/docs` to asset URLs, and removing it requires updating callers in `docs/src/app/[[...mdxPath]]/page.tsx:13-37` (canonical URL building, OG image URL building) and `docs/src/app/layout.tsx:46-49` (favicon paths). Mitigation: keep `getAssetPath` in place but redefine `DOCS_BASE_PATH = ""`. All call sites then produce `/foo` instead of `/docs/foo`. Then audit each call site individually — for the docs canonical URL, prepend `/docs/` literally (`alternates.canonical: '/docs/' + (mdxPath?.join('/') ?? '')`). Or simpler: keep `DOCS_BASE_PATH = "/docs"`, only call `getAssetPath` from inside the docs tree (where `/docs/` prefix is wanted), and never call it from blog tree.
3. **Nextra theme styling leaks between trees.** `nextra-theme-docs/style.css` is currently imported globally at `docs/src/app/layout.tsx:4`. Its CSS defines docs-shaped layout (sidebar grid, TOC offset). Mitigation: scope the docs styles to the docs subtree by importing `nextra-theme-docs/style.css` only in `app/docs/layout.tsx` rather than the root. Verify Nextra's stylesheet doesn't rely on `:root` CSS variables that other parts of the app expect — likely safe, but smoke-test before publish.
4. **`getPageMap()` includes blog content in the docs sidebar.** Per §5.3 — mitigated by `_meta.js` `display: 'hidden'` for the `blog` subtree. Verify by inspecting the rendered docs sidebar after the move.
5. **Sibling `/blog/page.tsx` vs `/blog/[[...slug]]/page.tsx` route precedence.** Next.js resolves `/blog` to the literal `page.tsx` over the catch-all — this is documented behavior. But verify with `next dev` and a smoke test before relying on it for the listing page.
6. **MDX components from `nextra-theme-docs` may not all suit blog rendering.** The docs theme styles tables in a docs-context way. Mitigation: hand-style table/blockquote/callout overrides in the blog tree's MDX components (extend `mdx-components.js` with blog-specific variants gated by URL). If that's invasive, defer to Phase 2 polish — v1 ships with whatever the docs theme renders for tables, and we tune later.
7. **Sitemap drift between dashboard and docs.** Today the dashboard sitemap hardcodes docs URLs. We're adding `docs/src/app/sitemap.ts` to enumerate blog URLs from the registry, plus a second-sitemap reference in `dashboard/src/app/robots.ts:26`. That's the correct architecture but it does mean two sitemap files to keep in sync over time. Mitigation: out of scope for this task to fully migrate docs URLs out of the dashboard sitemap — flag as follow-up.
8. **Cross-app `<Link>` to `/features` does not prefetch.** Per §8.7. Acceptable; same as today's docs footer. Authors should be told to write internal links as bare paths and not expect SPA navigation.
9. **`docsRepositoryBase` and `editLink={null}` from the docs `<Layout>` don't apply to blog tree.** Already handled by giving the blog tree its own `<Layout>` (or no Nextra layout at all — see §5.2). Risk that we accidentally inherit edit-link UI for blog posts: low, mitigated by separate per-segment layouts.
10. **OG generator route move.** If we keep it at `app/api/og/route.tsx` (top-level), make sure the proxy forwards `/api/og/*` to the docs container, NOT the dashboard container. Today there is presumably no `/api/og` route on the dashboard, so this should be fine, but verify. Alternatively keep it scoped to `/docs/api/og` and `/blog/api/og` as separate routes, at the cost of asset duplication.
11. **Single-process failure mode.** A blog build error breaks docs deployment (and vice versa). Trade-off accepted — this is the cost of single-process. Mitigation: registry validation runs at build time, so frontmatter errors fail fast and locally before reaching CI.
12. **Tailwind v4 in docs.** `docs/package.json:33` uses `tailwindcss: "^4"`. The blog's marketing layout will use the same Tailwind tokens as the docs site — fine, but means we cannot copy verbatim from `dashboard/src/app/[locale]/(public)/about/page.tsx` (which uses dashboard-specific design tokens). Plan: use docs-side Tailwind classes when implementing `BlogIndexHero`, `BlogPostHeader`, etc.; reference `docs/src/app/components/footer.tsx` for what's available.
13. **Analytics tracking on blog pages.** The docs root layout already injects the analytics script (`docs/src/app/layout.tsx:118-127`) gated on `docsTrackingEnabled`. Decision needed: do blog pages count as docs traffic for self-tracking purposes, or do we want a separate `data-site-id` for the blog? v1 default: use the same site ID — eat your own dog food, single funnel.

---

## 13. Phased rollout

### Phase 1 — v1 minimum viable (English, single post live at `/blog/eu-alternatives-to-google-analytics`)

**Target: 1 engineer, 2-3 days code + proxy update + content review.**

1. **Proxy owner alignment (out-of-band, gating).** Identify proxy owner. Communicate the §10 deliverable. Get a date for the `/blog/*` rule landing.
2. **Code:**
   - Drop `basePath` from `docs/next.config.mjs:17`.
   - Move `docs/src/app/[[...mdxPath]]/page.tsx` → `docs/src/app/docs/[[...mdxPath]]/page.tsx`.
   - Move `docs/src/app/api/og/route.tsx` → top-level `docs/src/app/api/og/route.tsx` (already top-level — just remove `getAssetPath`-style `/docs` prefix on canonical assertion if needed).
   - Add `docs/src/app/docs/layout.tsx` (current root layout chrome moved here).
   - Slim `docs/src/app/layout.tsx` to bare `<html>`/`<body>`/global `<Head>`/analytics `<Script>`/global `WebSite` JSON-LD.
   - Update `docs/src/lib/constants.ts:1-7` strategy per §12 risk 2.
   - Add `docs/src/app/blog/layout.tsx`, `page.tsx` (listing), `[[...slug]]/page.tsx`, `lib/{schema,registry,authors,seo}.ts`, `components/{BlogPostHeader,BlogPostFooter,BlogPostCard,BlogIndexHero,BlogFAQ,BlogStructuredData}.tsx`.
   - Extend `docs/src/mdx-components.js:14-24` with `FAQ`, `Cta`, `Callout`.
   - Add `docs/src/content/_meta.js` entry `blog: { display: 'hidden' }` to keep blog out of docs sidebar.
   - Add `docs/src/app/sitemap.ts` enumerating `/blog`, `/blog/<slug>` for all registry posts (Phase 2: extend with `/docs/*` URLs and remove from dashboard sitemap).
   - Update `dashboard/src/app/robots.ts:26` to include the second sitemap reference.
3. **Content:**
   - Migrate the EU-GA draft per §11.
   - Capture/produce 10 inline screenshots + 1 cover image.
   - Author 3-5 FAQs.
   - Verify the 8 unverified claims from draft section 4.
4. **Verification gate:**
   - `pnpm --filter docs build` passes.
   - Smoke test: `/docs` and `/docs/installation/cloud-hosting` render correctly with the docs sidebar (no regression).
   - `/blog` renders the listing with one card.
   - `/blog/eu-alternatives-to-google-analytics` renders with marketing chrome (no docs sidebar).
   - `Article` and `FAQPage` JSON-LD validate at https://validator.schema.org.
   - `/blog/sitemap.xml` returns valid XML with the post URL.
   - `dashboard/sitemap.xml` (existing) is unchanged.
   - Lighthouse SEO score ≥ 95 on the post page.
   - Manual: click `[features](/features)` from the post → resolves to dashboard `/features` (full nav).

### Phase 2 — polish (after one or two posts live)

**Target: 1 engineer, 2 days.**

- RSS feed at `/blog/feed.xml`.
- Tag filtering at `/blog/tag/[tag]`.
- Right-rail sticky TOC (Nextra's TOC component or hand-rolled — Nextra's docs theme provides `toc` from `importPage`, which we have access to, so reuse it).
- Per-post `relatedSlugs` frontmatter + `RelatedPosts` strip.
- OG image generator: extend `/api/og` to support `?type=blog` per §8.3 option (a).
- Move docs URL list out of dashboard sitemap into `docs/src/app/sitemap.ts` (the second sitemap built in Phase 1 grows to cover them too).

### Phase 3 — future / out-of-scope-for-v1

- **Multi-locale posts.** Out of v1 per user constraint. When revisited, evaluate Nextra's i18n model (https://nextra.site/docs/guide/i18n) — it does NOT use `next-intl`. Translation strategy and infra is a separate task.
- Search across docs+blog (Pagefind already covers docs; extend the index).
- Author pages (`/blog/author/[author]`).
- Newsletter capture wired to a real provider.
- Extract shared marketing components (footer, structured-data helpers) into a `@betterlytics/marketing-ui` workspace package so the blog/docs/dashboard footers stop drifting.

---

## 14. Open questions / things I couldn't verify

1. **Production reverse-proxy ownership and config location.** Per §10. The repo has no proxy config; the `Glob` for `nginx.conf|Caddyfile|vercel.json` returned nothing, and `docker-compose.yml:3-11` is local-dev only. Without knowing whether prod is Vercel routing, an external nginx, Cloudflare Workers, or something else, I cannot specify the exact config diff. **Action: identify proxy owner before merging the code change.** This is the same Open Question 1 from `BLOG_RENDERING_PLAN.md:372` — still unresolved.
2. **`getAssetPath()` blast radius after `basePath` removal.** Per §12 risk 2. I traced two callers (`docs/src/app/[[...mdxPath]]/page.tsx:13-37`, `docs/src/app/layout.tsx:46-49`) but did not exhaustively audit every `import` of `@/lib/constants`. Recommend a `Grep "getAssetPath\\|DOCS_BASE_PATH"` pass before the code change.
3. **Whether `nextra-theme-docs/style.css` can be safely scoped to a single segment layout.** §12 risk 3. Nextra docs do not explicitly state this is supported. Could ship in either configuration (global vs scoped); global is safer if there are CSS variable dependencies, scoped is cleaner if the styles don't leak.
4. **`_meta.js` `display: 'hidden'` semantics for excluding a top-level subtree from the page map.** §5.3. The pattern is well-established in Nextra for hiding individual pages, but I did not verify that hiding an entire subtree (`blog: { display: 'hidden' }`) prevents `getPageMap()` consumers from descending into it. Smoke-test before relying on it.
5. **Nextra's catch-all behavior with sibling literal `page.tsx`.** §12 risk 5. Next.js documents this works; verify in dev server before relying on it for `/blog` listing vs `/blog/[[...slug]]` post pages.
6. **Whether the docs container hostname/internal port (currently `docs:3002` per `docs/Dockerfile:30`) is the same one referenced in the production proxy config.** Cannot verify without the proxy config. Document the assumption clearly when handing off to the proxy owner.
7. **Per-tree `metadataBase`.** `docs/src/app/layout.tsx:19` sets `metadataBase: new URL("https://betterlytics.io")` already, so blog pages inherit it. This is correct for blog posts (canonical at `https://betterlytics.io/blog/<slug>`) but the docs subtree's `OpenGraph.url` calls in `[[...mdxPath]]/page.tsx:7-62` need a re-audit after `basePath` is removed — they currently produce `/docs/...` paths via `getAssetPath`, which combined with `metadataBase` yields full absolute URLs. Should still work but verify.
8. **Whether the docs deployment build pipeline assumes `basePath: "/docs"` anywhere outside `next.config.mjs`** (e.g., in CI scripts that test against `/docs/health`). Cannot verify without the deploy pipeline.
9. **OG generator path under Approach A.** Recommend top-level `app/api/og/route.tsx` so blog can reuse it, but that means the proxy needs to forward `/api/og` to the docs container. Confirm there's no `/api/og` collision on the dashboard side (`dashboard/src/app/api/`).
