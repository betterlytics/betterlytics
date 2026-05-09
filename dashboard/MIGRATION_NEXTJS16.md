# Next.js 16 Migration Plan — `dashboard/`

This document is an in-depth migration plan for upgrading the `dashboard/` package from Next.js 15.4.11 to Next.js 16. It is research-only — no application code has been changed.

The `docs/` package is **out of scope** for this plan. It is deployed independently of the dashboard and can be upgraded on its own schedule. Where earlier drafts of this document touched `docs/`, those mentions have been removed or marked out-of-scope.

Sources are cited inline. Where a fact could not be verified from authoritative documentation, it is explicitly marked **unverified**.

---

## 1. Executive Summary

- **Lift size: small-to-medium.** The dashboard is already aligned with most Next.js 16 expectations: all `params`/`searchParams`/`cookies()`/`headers()` call sites are already `await`-ed (Next 15 prep work has been done), there is no `pages/` directory, no AMP, no `serverRuntimeConfig`/`publicRuntimeConfig`, no `images.domains`, and no `experimental.ppr`. The bulk of the migration is renaming `middleware.ts` to `proxy.ts`, switching the `lint` script off `next lint`, a small layout edit to preserve scroll-behavior parity, and bumping deps. The custom webpack source-map hook is **kept in the upgrade PR** and removed in a separate follow-up.
- **Webpack hook — split into a follow-up PR.** The `webpack:` block in `next.config.ts` was added by PR #585 ("Enabled server-side source map for production builds") so OpenTelemetry-instrumented server code produces readable stack traces. The previous draft of this plan recommended dropping the block in the upgrade PR; we have since decided to **keep the block in the upgrade PR** and pass `--webpack` to `next build` (the supported long-term opt-out per the Next.js 16 blog). A separate follow-up PR will remove the block and the `--webpack` build flag once the OTel stack-frame readability question (R1b) has been resolved on staging. See §6 for the full investigation; see §9 R1/R1b for how the risk shifts between the two PRs.
- **Why split.** R1b (Turbopack server source-map output) is the load-bearing unknown. Bundling the framework upgrade with the build-system swap means a staging regression cannot be cleanly attributed to "the Next 16 bump" vs "moving off webpack" without bisecting. Splitting gives an independent rollback for each change. The cost of carrying `--webpack` in the upgrade PR is slower production builds (~2–5× slower per Vercel's published Turbopack benchmarks) until the follow-up lands; `next build --webpack` is explicitly supported in the Next 16 blog with no announced removal timeline.
- **Two-PR sequence:**
  - **Upgrade PR:** rename `middleware.ts` → `proxy.ts`; switch `lint` script off `next lint`; add `data-scroll-behavior="smooth"` to root `<html>`; bump `next`, `react`, `react-dom`, `eslint-config-next`, `@types/react*`; **keep** `next-intl` at `4.3.4` (verified compatible with Next 16; bump is a separate, independent decision — see §11.5); **keep** the `webpack:` block in `next.config.ts`; change the `build` script in `dashboard/package.json` from `"next build && pnpm run build:worker"` to `"next build --webpack && pnpm run build:worker"` so the existing webpack hook continues to apply. The `dev` script is left as `next dev --turbopack` (pre-16 behavior preserved); dropping the `--turbopack` flag is now an optional cosmetic cleanup, not part of this PR.
  - **Follow-up PR (`chore/nextjs-16-drop-webpack-hook` or similar):** remove the `webpack:` block + `productionBrowserSourceMaps: false` from `next.config.ts`; drop `--webpack` from the `build` script; run on Turbopack defaults; verify server stack-trace readability in OTel on staging per §6.6. The R1b investigation lives in this PR alone.
- **Key actions in priority order (Upgrade PR):**
  1. Rename `dashboard/src/middleware.ts` → `dashboard/src/proxy.ts` and rename the `middleware` function → `proxy`. Note: keeping the `middleware.ts` name still works in 16 *but* Vercel has stated `middleware.ts` will be removed in a future version, so renaming is the only safe path. ([blog § "`proxy.ts` (formerly `middleware.ts`)"](https://nextjs.org/blog/next-16))
  2. Switch the `lint` script off `next lint` (codemod: `next-lint-to-eslint-cli`).
  3. Add `data-scroll-behavior="smooth"` to the root `<html>` in `app/layout.tsx`.
  4. Bump `next`, `react`, `react-dom`, `eslint-config-next`, `@types/react*` to latest. (`next-intl` stays at `4.3.4` — verified Next 16-compatible.)
  5. Update the `build` script to `"next build --webpack && pnpm run build:worker"` so the existing `webpack:` hook keeps applying.
- **Key actions (Follow-up PR):**
  1. Remove the `webpack:` block + `productionBrowserSourceMaps: false` from `next.config.ts`.
  2. Drop `--webpack` from the `build` script.
  3. Verify on staging that server stack frames in OTel traces remain readable under Turbopack defaults; if they regress, revert this PR (single-PR rollback per §6.5).
- **`next-auth` v4.24.x: officially still supported (its peer range has long included broad Next versions), but the community is steering Next 16 users toward Auth.js v5. We are *not* planning a v4→v5 migration as part of this work — that is a separate, larger project.**
- **Recommendation: GO**, in three stages — first the upgrade PR (rename middleware → proxy, keep custom webpack hook + build with `--webpack`, update Node images, bump deps, run codemod); then the webpack-removal follow-up PR; then a Cache Components / `cacheComponents: true` and React Compiler evaluation. Avoid taking on new features in the upgrade PR.

---

## 2. Files to Change — Summary Table

The table below is exhaustive for the `dashboard/` package. Every file the audit (§4) flagged for action is listed. Sister-tooling files (Dockerfile, Dockerfile.selfhost, CI workflow) are listed only where a change is actually needed; rows marked "verify only" do not require an edit but should be checked at PR time.

`docs/` package: **no rows** (out of scope).

### 2.1 Files requiring an edit

The two-PR split (see §1) is reflected directly in the **PR** column: rows tagged **Upgrade** ship in the Next.js 16 upgrade PR; rows tagged **Follow-up** ship in the dedicated `chore/nextjs-16-drop-webpack-hook` PR that lands after the upgrade.

#### Upgrade PR

| # | File path | Phase | Change type | What changes (one sentence) | Done by | Risk |
| - | --- | --- | --- | --- | --- | --- |
| 1 | `dashboard/package.json` | 1 | dep bump | Bump `next` to `^16.x`, `eslint-config-next` to matching `^16.x`, `react`/`react-dom` to latest 19.x, `@types/react`/`@types/react-dom` to latest. (`next-intl` is **not** bumped in this PR — see §11.5.) | manual (pnpm add) | low |
| 2 | `dashboard/package.json` | 0 | script change | Replace `"lint": "next lint"` with the Flat-config ESLint invocation produced by the codemod (e.g. `"lint": "eslint ."`). | codemod (`next-lint-to-eslint-cli`) | low |
| 3 | `dashboard/package.json` | 4 (optional, nice-to-have) | script change | Drop the now-redundant `--turbopack` from `"dev": "next dev --turbopack"` (Turbopack is the default in 16). **Not required for the upgrade**; see §11 audit. | manual | low |
| 4 | `dashboard/package.json` | 1 | script change | Change `"build": "next build && pnpm run build:worker"` → `"build": "next build --webpack && pnpm run build:worker"` so the existing `webpack:` hook in `next.config.ts` continues to apply. The `&& pnpm run build:worker` chain is preserved verbatim. This row is what makes the upgrade PR work without removing the webpack block. | manual | low |
| 5 | `pnpm-lock.yaml` | 1 | automatic | Lockfile regenerated by `pnpm install` after the dep bump. | automatic via dep bump | low |
| 6 | `dashboard/src/middleware.ts` → `dashboard/src/proxy.ts` | 1 | rename + edit | Rename file; rename `function middleware` → `function proxy`; keep the `intlMiddleware`/`createMiddleware` import names (those are library internals, unaffected). Keep `export const config = { matcher: [...] }` as-is. | codemod (`upgrade latest`) | medium |
| 7 | `dashboard/src/app/layout.tsx` | 2 | edit | Add `data-scroll-behavior="smooth"` to the root `<html>` element (currently line 47: `<html lang={locale} suppressHydrationWarning>`) to preserve Next 15's auto-scroll-override behavior. | manual | low |
| — | `dashboard/next.config.ts` | n/a (Upgrade PR) | **no edit** | The `webpack:` block and `productionBrowserSourceMaps: false` are **kept** in the upgrade PR. Their removal is the entire scope of the follow-up PR (row 8). | n/a | n/a |

#### Follow-up PR (`chore/nextjs-16-drop-webpack-hook`)

| # | File path | Phase | Change type | What changes (one sentence) | Done by | Risk |
| - | --- | --- | --- | --- | --- | --- |
| 8 | `dashboard/next.config.ts` | 5 | edit | Remove the `webpack: (config, { isServer }) => { ... }` block and the now-orphaned `productionBrowserSourceMaps: false` line (both added by PR #585 — see §6). | manual | **high** (R1b — observability degradation if Turbopack server source maps are not readable; verified on staging post-deploy per §6.6) |
| 9 | `dashboard/package.json` | 5 | script change | Revert the build script back to `"build": "next build && pnpm run build:worker"` (drop `--webpack`) so production builds use Turbopack defaults. | manual | medium (paired with row 8) |

### 2.2 Files to verify (no edit expected)

These files were inspected during the audit and are believed compatible with Next 16 as-is. They should be re-checked at PR time but should not need modification.

| File path | Phase | Why we looked | Expected outcome |
| --- | --- | --- | --- |
| `dashboard/eslint.config.mjs` | 0 | Flat config required in 16; check that the `next-lint-to-eslint-cli` codemod doesn't need to add anything here. | No change. Already on Flat config; `next/core-web-vitals` + `next/typescript` extends will continue to work after `eslint-config-next` is bumped to 16.x. |
| `dashboard/Dockerfile` | 0 | Confirm `node:20-slim` resolves to ≥20.9 for the Node 16 floor. | Verify only. `node:20-slim` is the current 20.x LTS, ≥20.9 since Q4-2023. If the runner picks up an older pinned image somehow, bump to `node:20.9-slim` or `node:20-bookworm-slim`. |
| `Dockerfile.selfhost` | 0 | Already on `node:24-slim` for the dashboard build stage. | No change. |
| `.github/workflows/pr-checks.yml` | 0 | Check the `Lint check` step (currently `pnpm --filter dashboard lint`) still works after the script swap, and that `node-version: "20"` resolves to ≥20.9. | Verify only. The lint step keeps its name; the underlying `package.json` script changes (see row 2). The `setup-node` action installs the latest 20.x patch by default. |
| `dashboard/src/instrumentation.ts` | 5 (follow-up PR) | Server source maps were added (PR #585) partly to make `@vercel/otel`-instrumented server stack traces readable. Confirm OTel traces still resolve to source locations on Turbopack defaults. | Verify only — and **only in the follow-up PR** (§8 Phase 5). The upgrade PR keeps the webpack hook, so OTel readability is unchanged from today. See §6 for details. |
| `dashboard/src/auth/api-auth.ts` | 4 (optional) | Uses `unstable_cache` from `next/cache`. Not in the v16 removal list. | No change in upgrade PR. Optional follow-up: migrate to `'use cache'` + `cacheLife`/`cacheTag` after enabling `cacheComponents`. |
| `dashboard/src/app/api/metrics/route.ts`, `dashboard/src/app/api/mcp/route.ts` | n/a | Both export `runtime = 'nodejs'`. | No change. Still valid in 16. |
| `dashboard/src/app/sitemap.ts` | n/a | Single sitemap, no `generateSitemaps`. | No change. The async-`id` change for `generateSitemaps` does not apply. |
| All `dashboard/src/app/**/page.tsx`, `**/layout.tsx`, `**/route.ts` | n/a | Async APIs migration. | No change. All `params`/`searchParams`/`cookies()`/`headers()` call sites are already `await`-ed (verified in §4.1). |
| `dashboard/messages/*.json` | n/a | Translation files, untouched by Next 16. | No change. |
| `dashboard/prisma/schema.prisma` | n/a | Decoupled from Next.js. | No change. |

### 2.3 Files explicitly out of scope

- `docs/package.json`, `docs/Dockerfile`, anything else under `docs/` — staged separately, not addressed in this plan.

---

## 3. Current State

### 3.1 Versions in `dashboard/package.json`

Source of truth: [`dashboard/package.json`](./package.json)

| Package | Current | Notes |
| --- | --- | --- |
| `next` | `15.4.11` | Pinned to exact version (no `^`). |
| `react` | `^19.0.4` | Already on React 19. |
| `react-dom` | `^19.0.4` | |
| `eslint-config-next` | `15.4.11` | Pinned to exact, will need to track `next`. |
| `@types/react` | `^19` | |
| `@types/react-dom` | `^19` | |
| `next-intl` | `4.3.4` | i18n library; pinned exact (no caret). See compatibility note in §5. |
| `next-auth` | `^4.24.13` | Auth.js v4. v5 is recommended for new Next 16 projects but v4 still functions. |
| `next-themes` | `^0.4.6` | |
| `nextjs-toploader` | `^3.8.16` | Top-loading bar component. |
| `@trpc/client`, `@trpc/react-query`, `@trpc/server` | `^11.16.0` | tRPC v11. |
| `@tanstack/react-query` | `^5.74.4` | |
| `@vercel/otel` | `^2.1.0` | OpenTelemetry registration — relevant to the webpack-hook decision (§6). |
| `@opentelemetry/api` | `^1.9.0` | Used by `dashboard/src/observability/clickhouse-instrumented.ts`. |
| `tailwindcss` / `@tailwindcss/postcss` | `^4` | Tailwind v4. |
| `eslint` | `^9.39.2` | Already on flat config (`eslint.config.mjs` exists). |
| `typescript` | `^5` | |
| `@types/node` | `^20` | |

### 3.2 Relevant `dashboard/next.config.ts`

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() { /* /login -> /signin, /register -> /signup, with locale variants */ },
  async headers() { /* X-Accel-Buffering: no on /dashboard/:path* */ },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.devtool = 'source-map';
    }
    return config;
  },
  productionBrowserSourceMaps: false,
};
export default createNextIntlPlugin()(nextConfig);
```

Things to note:
- `output: 'standalone'` — used by the Dockerfile (`/app/.next/standalone` is copied into the runner image). Compatible with Next 16, no change needed; standalone-output shape is verified post-migration via the Phase 3 Docker smoke-test (per user direction, 2026-05-02; see §8 Phase 3 checklist).
- `webpack:` hook — **see §6 for the full decision log.** The block is **kept** in the upgrade PR (with `--webpack` added to the build script) and removed in a dedicated follow-up PR.
- `createNextIntlPlugin()` — wraps the config; this remains the same in Next 16 (uses `next.config.ts` extension points untouched by the upgrade, per `next-intl` docs).

### 3.3 Runtime / infra

- `dashboard/Dockerfile` uses `FROM node:20-slim`. **Compatible** (Node 16 requires ≥20.9.0). `node:20-slim` resolves to current 20.x LTS, which is ≥20.9.0 since Q4-2023. Confirm at build time.
- `Dockerfile.selfhost` already uses `node:24-slim` for the dashboard build stage — fine.
- `.github/workflows/pr-checks.yml` pins `node-version: "20"` — fine.
- Local dev: `node --version` reports `v20.12.2` — fine.

### 3.4 Existing async-API usage

All call sites already use `await` (no sync access slipped in). Verified by grep over `dashboard/src/`:
- `cookies()` / `headers()`: `dashboard/src/services/session.service.ts:18`, `dashboard/src/lib/cookies.ts:7`, `dashboard/src/i18n/request.ts:13`, `dashboard/src/constants/cookies.ts:15`, `dashboard/src/app/api/webhooks/stripe/route.ts:21`, `dashboard/src/app/actions/system/timezone.action.ts:10`. All `await`-ed.
- `params: Promise<...>` / `searchParams: Promise<...>` typing is in place across all 30+ pages and layouts under `dashboard/src/app/`. No sync `params.x` access was found.
- `draftMode()`: not used.

This means the **biggest** Next 15→16 breaking change (sync removal of these APIs) is **already a no-op** for this codebase.

---

## 4. Next.js 16 — What Changed (with citations)

All claims below are from the official Next.js 16 announcement and upgrade guide unless otherwise noted.

Primary sources:
- Next.js 16 release blog post: https://nextjs.org/blog/next-16
- Upgrading guide: https://nextjs.org/docs/app/guides/upgrading/version-16

### 4.1 Required runtime / browser baselines
- **Node.js 20.9+** required. Node 18 dropped. ([upgrade guide — "Node.js runtime and browser support"](https://nextjs.org/docs/app/guides/upgrading/version-16))
- **TypeScript 5.1+**. (same source)
- Browsers: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+. (same source)

### 4.2 Turbopack is the default
- `next dev` and `next build` now use Turbopack by default. The `--turbopack`/`--turbo` flag is no longer needed. ([blog § "Turbopack (stable)"](https://nextjs.org/blog/next-16))
- **If a custom `webpack` config is detected, `next build` will fail.** Three options: (a) `next build --turbopack` to ignore the webpack config, (b) port the webpack config to the Turbopack equivalent, (c) opt out with `next build --webpack`. ([upgrade guide § "Turbopack by default"](https://nextjs.org/docs/app/guides/upgrading/version-16))
- The `experimental.turbopack` config key has moved out of experimental and is now top-level `turbopack`. (same source)
- **Webpack opt-out is not "deprecated and removed soon."** The blog explicitly tells webpack-using teams to keep using `next dev --webpack` / `next build --webpack`, and the upgrade guide says: *"Submit a comment to this thread if you are unable to switch to Turbopack."* No removal timeline is stated. ([blog § "Turbopack (stable)"](https://nextjs.org/blog/next-16); [upgrade guide § "Opting out of Turbopack"](https://nextjs.org/docs/app/guides/upgrading/version-16))

### 4.3 Async Request APIs — fully removed sync access
- `cookies()`, `headers()`, `draftMode()`, plus `params` / `searchParams` in `layout.js` / `page.js` / `route.js` / `default.js` / metadata image conventions are **async only**. The temporary sync-compat introduced in 15 is gone. ([upgrade guide § "Async Request APIs (Breaking change)"](https://nextjs.org/docs/app/guides/upgrading/version-16))
- Codemod available; `next typegen` (introduced in 15.5) generates `PageProps<...>`, `LayoutProps<...>`, `RouteContext<...>` helpers.

### 4.4 `middleware.ts` deprecated — renamed to `proxy.ts`
- Rename `middleware.ts` → `proxy.ts`; rename the named export `middleware` → `proxy`. ([upgrade guide § "`middleware` to `proxy`"](https://nextjs.org/docs/app/guides/upgrading/version-16))
- `proxy.ts` runs on the **Node.js** runtime; `edge` is **NOT** supported. To keep edge runtime, the deprecated `middleware.ts` filename still works in 16 (it is deprecated, not removed). Vercel says it will follow up with edge guidance in a minor.
- **The deprecated `middleware.ts` file *will* be removed in a future version.** ([blog § "`proxy.ts` (formerly `middleware.ts`)"](https://nextjs.org/blog/next-16): *"The `middleware.ts` file is still available for Edge runtime use cases, but it is deprecated and will be removed in a future version."*) Renaming is therefore the only forward-compatible path.
- Config flags rename: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`. The codemod handles this.

### 4.5 Cache Components / removal of `experimental_ppr`
- `experimental.ppr` flag and `export const experimental_ppr` route segment are **removed**. To opt into PPR-style behavior, use the new `cacheComponents: true` top-level config. ([upgrade guide § "Partial Prerendering (PPR)"](https://nextjs.org/docs/app/guides/upgrading/version-16) and [blog § "Cache Components"](https://nextjs.org/blog/next-16))
- The new model centers on the `'use cache'` directive. **Existing PPR users should stay on a 15.x canary**; PPR semantics changed in 16.

### 4.6 Cache APIs
- `revalidateTag(tag)` (single-arg) is **deprecated**; signature is now `revalidateTag(tag, profile)` where `profile` is a `cacheLife` profile name (e.g. `'max'`, `'hours'`, `'days'`) or `{ expire: number }`. ([blog § "Improved Caching APIs"](https://nextjs.org/blog/next-16))
- New `updateTag(tag)` (Server Actions only) for read-your-writes semantics.
- New `refresh()` (Server Actions only) to refresh uncached data without touching the cache.
- `unstable_cacheLife` / `unstable_cacheTag` are now stable as `cacheLife` / `cacheTag` (codemod removes the `unstable_` prefix).

### 4.7 `next/image` defaults & restrictions (multiple breaking changes)
All from [upgrade guide § "`next/image` changes"](https://nextjs.org/docs/app/guides/upgrading/version-16):
- **Local images with query strings** now require an `images.localPatterns` rule containing `{ pathname, search }` to defeat enumeration attacks.
- **`images.minimumCacheTTL`** default changed from `60s` → `4 hours` (14400s).
- **`images.imageSizes`** default array no longer includes `16`.
- **`images.qualities`** default changed from "any quality" to `[75]`. `quality` props are coerced to the closest allowed value.
- **`images.dangerouslyAllowLocalIP`** added — local IP image optimization is blocked by default.
- **`images.maximumRedirects`** default changed from "unlimited" to `3`.
- `next/legacy/image` deprecated; `images.domains` deprecated (use `remotePatterns`).

### 4.8 Other removals
From [upgrade guide § "Removals"](https://nextjs.org/docs/app/guides/upgrading/version-16):
- **AMP** support fully removed (`useAmp`, `export const config = { amp: true }`, `amp` config key).
- **`next lint`** command removed; `next build` no longer runs lint. Codemod available: `npx @next/codemod@canary next-lint-to-eslint-cli .`. The `eslint` option in `next.config` is removed.
- **`serverRuntimeConfig` / `publicRuntimeConfig`** removed — use env vars (and `connection()` for runtime reads).
- **`devIndicators.appIsrStatus` / `buildActivity` / `buildActivityPosition`** removed.
- **`experimental.dynamicIO`** renamed to `cacheComponents`.
- **`unstable_rootParams`** removed (no replacement yet).

### 4.9 Behavioral changes that don't require code edits but may surprise
- **`scroll-behavior: smooth` no longer auto-overridden during navigation.** Add `data-scroll-behavior="smooth"` to `<html>` to opt back in. ([upgrade guide § "Scroll Behavior Override"](https://nextjs.org/docs/app/guides/upgrading/version-16))
- **`next dev` and `next build` use separate output dirs** (`.next/dev` vs `.next`). A lockfile prevents concurrent same-mode runs.
- **Parallel-route slots now require `default.js`** — builds fail without one for any `@slot` directory. (same source)
- **`@next/eslint-plugin-next`** defaults to ESLint Flat Config.
- **Sass loader** bumped to v16; modern Sass syntax (`~bootstrap/...` tilde imports no longer work in Turbopack — n/a here, no Sass).
- **`next dev` now loads `next.config` once instead of twice.** `process.argv.includes('dev')` returns `false` inside the config file under `next dev`. (same source)
- **Build output no longer prints `size` / `First Load JS` columns.**

### 4.10 Async-id changes for metadata routes (rare, included for completeness)
- `opengraph-image`, `twitter-image`, `icon`, `apple-icon` image generators receive `params` and `id` as **promises** (`generateImageMetadata` still receives sync `params`). N/A here — we don't define `opengraph-image.{tsx,jsx}` route conventions; OG images come from the metadata object only.
- `sitemap` `generateSitemaps` now passes `id` as a `Promise<string>` to the sitemap function. **N/A** — our `dashboard/src/app/sitemap.ts` does not use `generateSitemaps` (single sitemap returning the full array).

### 4.11 React 19.2 + canary features
- App Router uses the React canary that includes 19.2 features (`<ViewTransition>`, `useEffectEvent`, `<Activity>`).
- React Compiler support now stable (`reactCompiler: true` top-level option, opt-in, requires `babel-plugin-react-compiler`).

---

## 5. Codebase Audit — Per Breaking Change

Each subsection lists the concrete files affected and the action required.

### 5.1 Async APIs (cookies/headers/params/searchParams)
**Status: already migrated.** All Next 15 prep was completed.
- `cookies()` / `headers()` — 6 call sites, all `await`ed. Files:
  - `dashboard/src/app/actions/system/timezone.action.ts:10`
  - `dashboard/src/app/api/webhooks/stripe/route.ts:21`
  - `dashboard/src/i18n/request.ts:13`
  - `dashboard/src/lib/cookies.ts:7`
  - `dashboard/src/constants/cookies.ts:15`
  - `dashboard/src/services/session.service.ts:18`
- `params` / `searchParams` — typed as `Promise<...>` and `await`ed across all 30+ pages/layouts in `dashboard/src/app/`. Spot-checked:
  - `dashboard/src/app/[locale]/layout.tsx:7,11`
  - `dashboard/src/app/(protected)/dashboard/[dashboardId]/layout.tsx:21,77`
  - `dashboard/src/app/[locale]/(public)/vs/[competitor]/page.tsx:42`
  - `dashboard/src/app/(protected)/billing/success/page.tsx:12` (searchParams)
  - All `generateMetadata({ params })` signatures already use `Promise`.

**Action: optional.** Run the codemod just to be sure (`@next/codemod@canary upgrade latest` runs the relevant async-dynamic-API transform); expected to be a no-op.

### 5.2 `middleware.ts` → `proxy.ts`
**Status: needs rename + function rename.**
- File: `dashboard/src/middleware.ts` (current 18 lines).
- Current named export: `function middleware(request)` — rename to `proxy`.
- Inner function calls `intlMiddleware(request)` — `next-intl`'s helper variable name is internal and unaffected.
- The `export const config = { matcher: [...] }` stays.
- **Runtime check:** the current file does **not** specify `runtime: 'edge'`, so the default Node.js runtime is fine under `proxy.ts`.
- Codemod: the upgrade codemod (`@next/codemod@canary upgrade latest`) handles the file rename, the function rename, and the `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize` config rename. We don't use `skipMiddlewareUrlNormalize`.

**Action:**
1. Run codemod, OR
2. Manually rename `dashboard/src/middleware.ts` → `dashboard/src/proxy.ts`, rename `function middleware` → `function proxy`.

**Caveat:** `next-intl`'s docs show its examples now under "Proxy / middleware" (https://next-intl.dev/docs/routing/middleware) — the createMiddleware factory works identically; the file just lives at `proxy.ts`.

### 5.3 Custom `webpack:` hook in `next.config.ts`
**Status: handled in the upgrade PR by passing `--webpack`; removed in a separate follow-up PR — full decision log in §6 below.**

This section used to be the longest unresolved item in the plan. The investigation (PR-585 history, Turbopack docs, OTel instrumentation) is now consolidated in **§6 "Webpack Hook — Decision and Path Forward"**. Short version: the upgrade PR **keeps** the block and passes `--webpack` to `next build` so the existing hook continues to apply. The block is removed in a dedicated follow-up PR (§8 Phase 5).

### 5.4 `experimental_ppr` / `experimental.ppr`
**Status: not used.**
- Grep confirms no `experimental_ppr` exports anywhere in `dashboard/src`.
- `next.config.ts` does not set `experimental.ppr`.
- No action.

### 5.5 `unstable_cache`, `unstable_cacheLife`, `unstable_cacheTag`
**Status: one usage, still supported in 16, follow-up migration recommended by upstream docs.**
- File: `dashboard/src/auth/api-auth.ts:6,84-89` — uses `unstable_cache` from `next/cache` for a 5-minute demo-mode response cache.

`unstable_cache` is **NOT removed in Next 16**; the existing call in `dashboard/src/auth/api-auth.ts:84-89` continues to function unchanged through the upgrade. The "Note" callout at the top of the [`unstable_cache` API docs](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) recommends migrating to either the `'use cache'` directive or the patterns documented at [Caching in Next.js](https://nextjs.org/docs/app/getting-started/caching) — but this is guidance, not a forcing function for the upgrade PR. Only `unstable_cacheLife`/`unstable_cacheTag` were renamed (we don't use them).

**Action: keep as-is in the upgrade PR.** Migration to `'use cache'` + `cacheLife`/`cacheTag` is a Phase 4 follow-up (see §8) after `cacheComponents: true` is evaluated.

### 5.6 `revalidateTag` / `updateTag`
**Status: not used.** Grep finds no `revalidateTag` or `updateTag` call sites in `dashboard/src`. No action.

### 5.7 `next/image`
**Status: heavy use, mostly safe; check for query strings and qualities.**
- 15 component files import from `next/image`. Most use static public assets with no query strings.
- **`images.localPatterns`** — we don't currently set it. If any `<Image src="/some/path?v=1" />` exists, it will break. **Audit grep** for `<Image[^>]+src="/[^"]*\?` returned no matches in the source files I checked; safe to assume **no action needed**, but worth a final grep before merge.
- **`qualities` default → `[75]`** — we never pass `quality={...}` props (no matches found for `quality=`); default 75 is fine.
- **`minimumCacheTTL` default 60s → 4h** — silent change. May affect favicons and external assets if any are served via the Next image optimizer. **Action: add `images: { minimumCacheTTL: 60 }` if we want to preserve current behavior, OR accept the new default.** Recommendation: accept the new default (lower bills, lower CPU), document in PR.
- **`maximumRedirects` default → 3** — likely fine; we do not knowingly fetch images that redirect. Accept default.
- **`dangerouslyAllowLocalIP`** — production builds don't fetch from local IPs. Leave at the new restrictive default.
- **`images.domains` deprecation** — we don't set `domains` (not in `next.config.ts`); we also don't appear to set `remotePatterns`. If any `<Image>` references an external host, the build will fail in 16 the same way it does in 15 today. No action needed for the upgrade.
- **`next/legacy/image`** — not used.

### 5.8 Parallel routes `default.js` requirement
**Status: not affected.**
- Searched `dashboard/src/app` for directories starting with `@` (parallel-route slot convention). **None found.**
- No action.

### 5.9 Sitemap / robots / metadata images
- `dashboard/src/app/sitemap.ts` — single sitemap, no `generateSitemaps`. **Not affected** by the async `id` change.
- `dashboard/src/app/robots.ts` — uses `MetadataRoute.Robots`, no changes needed.
- No `opengraph-image.{tsx,jsx}` / `twitter-image.{tsx,jsx}` / `icon.{tsx,jsx}` / `apple-icon.{tsx,jsx}` route convention files present (only static `apple-icon.png` and inline `icons` field in `metadata`). **Not affected** by the async `params` / `id` change for metadata images.

### 5.10 `next lint` removal
**Status: needs script change.**
- `dashboard/package.json` script: `"lint": "next lint"`. This script will fail in Next 16. The codemod (`next-lint-to-eslint-cli`) rewrites it to call ESLint directly.
- `dashboard/eslint.config.mjs` already exists and uses Flat Config (`...compat.extends('next/core-web-vitals', 'next/typescript')`), so we are **already 90% there**.
- CI: `.github/workflows/pr-checks.yml` calls `pnpm --filter dashboard lint` (line 65). The step name doesn't change; only the underlying script changes.

**Action:** run the `next-lint-to-eslint-cli` codemod or manually change the script to `"lint": "eslint ."`. Adjust ignored paths if needed (we want `.next/`, `node_modules/` ignored — the existing flat config handles this via defaults).

### 5.11 `serverRuntimeConfig` / `publicRuntimeConfig` / `getConfig`
**Status: not used.** Grep confirms no `getConfig`, `next/amp`, `useAmp`, `publicRuntimeConfig`, `serverRuntimeConfig` references. No action.

### 5.12 `scroll-behavior`
**Status: relevant; decision required.**
- `dashboard/src/app/globals.css:267,273` sets `scroll-behavior: smooth` on `html` and `html.dark`.
- In Next 15, the framework would temporarily flip this to `auto` during navigation; in Next 16 it does **not** unless `data-scroll-behavior="smooth"` is on `<html>`.
- **Symptom of inaction:** route navigations may scroll smoothly to top instead of jumping instantly. Some users will perceive this as slower.
- File to edit: `dashboard/src/app/layout.tsx:47` (the `<html lang={locale} suppressHydrationWarning>` open tag).

**Action:** add `data-scroll-behavior="smooth"` to the root `<html>` element to preserve previous behavior, OR remove the `scroll-behavior: smooth` global CSS rule entirely if we always want instant nav scroll. Recommend the data attribute (least surprising).

### 5.13 `eslint-config-next` peer pin
- `dashboard/package.json` pins `"eslint-config-next": "15.4.11"`. **Action: bump in lockstep with `next` (use `^16.x` or pin to a specific 16.x release).**

### 5.14 Route-segment config exports
- Two `runtime = 'nodejs'` exports found:
  - `dashboard/src/app/api/metrics/route.ts:31`
  - `dashboard/src/app/api/mcp/route.ts:7`
- These remain valid in Next 16. No action.

### 5.15 Turbopack-specific concerns
- `next dev --turbopack` already in use (`dashboard/package.json` `"dev": "next dev --turbopack"`). Stays valid; the `--turbopack` flag becomes a no-op default. **Optional cleanup:** drop the flag.
- `next build` is **not** currently using `--turbopack`. Once 16 lands, it will use Turbopack by default — which would clash with our existing `webpack:` hook in `next.config.ts`. The upgrade PR mitigates this by adding `--webpack` to the `build` script (§2.1 row 4); the hook is removed in a dedicated follow-up PR (§8 Phase 5). See §6 for the full decision log.
- No `experimental.turbopack` block to migrate to top-level.

### 5.16 Other config / behavior to validate post-upgrade
- `output: 'standalone'` + Dockerfile (`/app/.next/standalone`) — verified post-migration via the §8 Phase 3 Docker smoke-test (per user direction, 2026-05-02).
- `next dev` writing to `.next/dev` — **may conflict** with `.gitignore` rules / IDE assumptions. The `.gitignore` already ignores `.next/`, so `.next/dev/` is also covered.
- Custom `instrumentation.ts` — Next 16 keeps the instrumentation hook (no breaking change in the upgrade guide). No action. (The file at `dashboard/src/instrumentation.ts` registers `@vercel/otel` and starts background jobs.)

---

## 6. Webpack Hook — Decision and Path Forward

This section consolidates the investigation into the `webpack:` block in `next.config.ts`. The previous version of this plan flagged this as the largest open question; the answer is now clear enough to make a recommendation.

### 6.1 What the hook does today

```ts
webpack: (config, { isServer }) => {
  if (isServer) {
    config.devtool = 'source-map';
  }
  return config;
},
productionBrowserSourceMaps: false,
```

Two things are happening:
1. For the **server** webpack compilation, the devtool is forced to `'source-map'` — i.e. emit external `.js.map` files alongside the compiled server bundle so stack traces can be resolved to source positions.
2. For the **client** compilation, `productionBrowserSourceMaps: false` (the default) is reaffirmed — no client-side maps are shipped.

### 6.2 Why it was added

Both lines were introduced together by **PR #585, "Enabled server-side source map for production builds"** ([commit `c7b1533`, 2025-12-03](https://github.com/betterlytics/betterlytics/pull/585)). Author: Lindharden. PR body: *"This enables server-side source map for the production build to make debugging easier."*

The hook is **not** a Sentry/source-map-upload integration — there is no Sentry dependency, no `@sentry/*` package, no source-map upload step in `dashboard/Dockerfile`, `Dockerfile.selfhost`, `.github/workflows/pr-checks.yml`, or `.github/workflows/publish.yml`. Grep across the repo for `sentry` returns matches only in `pnpm-lock.yaml` (transitive) and inside the `static/replay.js` tracking script bundle — neither relevant to dashboard server runtime.

The hook **is** complementary to the OpenTelemetry stack:
- `dashboard/src/instrumentation.ts` registers `@vercel/otel`, sending spans to whatever OTel collector is configured by `OTEL_SERVICE_NAME`.
- `dashboard/src/observability/clickhouse-instrumented.ts` adds `db.clickhouse.*` spans via `@opentelemetry/api`.
- When an exception is recorded in a span (`span.recordException(err)`), OTel ingestion benefits from server-side `.js.map` files to symbolicate the stack frames.

In short: the hook exists so that **server-side stack traces in OTel traces, log lines, and crash reports point at the original TypeScript source positions, not at the compiled webpack output**.

### 6.3 What Turbopack does for source maps

The Turbopack config reference ([next.config.js → turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)) lists exactly five top-level options: `root`, `rules`, `resolveAlias`, `resolveExtensions`, `debugIds`. **There is no `devtool`-equivalent option, and there is no documented switch for "emit server source maps in production".**

`debugIds` is unrelated — it injects [TC39 debug IDs](https://github.com/tc39/ecma426/blob/main/proposals/debug-id.md) into JS bundles and source maps (a sourcemap-resolution mechanism for tools like Sentry). It's an addition for tools that already consume source maps; it doesn't change *whether* maps are emitted.

What Turbopack actually does in production for server bundles is **not explicitly documented** in the v16 upgrade guide or the Turbopack reference. **This is the load-bearing uncertainty.** Empirically, the community-reported behavior is that Turbopack production builds emit server source maps by default, but I could not find a Vercel-authored statement to that effect at the time of writing — **unverified**.

The closest thing in official docs is the upgrade guide's silence on the topic combined with the fact that `productionBrowserSourceMaps` is the only documented sourcemap toggle and it is documented as **client-only**. Server source maps in Turbopack appear to be an internal implementation detail rather than a configurable surface.

### 6.4 Is webpack itself going away?

**No, not soon.** The Next.js 16 blog explicitly tells webpack-using teams how to keep webpack:

> *"For apps with custom webpack setups, you can continue using webpack by running:*
> ```
> next dev --webpack
> next build --webpack
> ```*"* — [Next.js 16 blog § "Turbopack (stable)"](https://nextjs.org/blog/next-16)

The upgrade guide repeats: *"If you need to continue using Webpack, you can opt out with the `--webpack` flag."* There is **no removal timeline announced** for `--webpack`. The framing is "we recommend Turbopack; here's how to keep webpack if you need to."

This is in contrast to `middleware.ts`, which the same blog explicitly says *"will be removed in a future version."* No such language attaches to `--webpack`.

Bottom line: `next build --webpack` is a **supported long-term escape hatch**, not a deprecation runway.

### 6.5 Recommendation

**Two-PR sequence.** Keep the `webpack:` block (and `productionBrowserSourceMaps: false`) in the upgrade PR; pass `--webpack` to `next build` so the existing hook continues to apply. Remove the block in a separate, dedicated follow-up PR (`chore/nextjs-16-drop-webpack-hook`), and verify Turbopack server-stack-trace readability on staging there.

Reasoning:
1. **R1b is the load-bearing unknown.** Turbopack server source-map output in production is not documented (see §6.3) — the question is empirical. Bundling that empirical question with the framework upgrade means a staging regression can't be cleanly attributed to "the Next 16 bump" vs "the build-system swap" without bisecting.
2. **Independent rollback.** Splitting gives a clean, single-PR rollback for either change in isolation. Reverting "Next 16 was a mistake" and reverting "Turbopack source maps don't work for our OTel setup" are two different decisions with two different blast radii.
3. **`next build --webpack` is supported long-term.** The Next.js 16 blog explicitly tells webpack-using teams to keep using `--webpack` (see §6.4). There is **no announced removal timeline**. Carrying the flag in the upgrade PR is not technical debt; it's the framework-recommended escape hatch.
4. **Cost is build-time only.** The visible cost of keeping `--webpack` in the upgrade PR is slower production builds — Vercel's published Turbopack benchmarks claim ~2–5× speedups for builds in their reference projects. Until the follow-up PR lands, our CI builds run at the slower webpack speed. No runtime regression. No functional change.
5. **Reversible at any time.** The follow-up PR is one commit (remove the block, drop `--webpack`). It can be staged, deployed, observed, and rolled back independently.

**Fallback ladder (in order of preference, post-split):**

1. **Upgrade PR: keep the block, build with `--webpack`** (the current recommendation). No webpack-related risk during the framework upgrade.
2. **Follow-up PR: remove the block and drop `--webpack`.** Verify on staging per §6.6. If frames are readable, ship to production.
3. **If the follow-up regresses stack-frame readability on staging:** revert the follow-up PR (single-PR rollback). The upgrade PR remains in place; we are still on Next 16 with `--webpack` and the original `webpack:` hook.
4. **If somebody finds a Turbopack-side switch** (e.g. an undocumented env var or future config key for forcing inline source maps) — port to it in a third PR. **Unverified that one exists today.**

### 6.6 Post-deploy verification (follow-up PR only)

This verification belongs to the **follow-up PR** (`chore/nextjs-16-drop-webpack-hook`), **not** the upgrade PR. The upgrade PR keeps the `webpack:` block, so server stack-trace readability is unchanged from today and does not require fresh verification.

Per user direction (2026-05-02), this is not a gating pre-PR experiment — we trust Turbopack's defaults and verify on staging immediately after deploying the follow-up PR. Reverting the follow-up PR (per §6.5 fallback step 3) is the rollback if verification fails; that revert leaves us on Next 16 with the webpack hook intact and `--webpack` re-enabled in the build script.

The verification (run against the staging deploy of the follow-up PR):
1. Inspect `dashboard/.next/standalone/.next/server/` in the built image for `.js.map` files.
2. Deliberately throw a typed error from a server action, then inspect (a) the log output and (b) any OTel exception span recorded by `recordException`. Verify the stack frames point at `dashboard/src/...` paths, not opaque chunk identifiers.
3. If frames are readable: keep the configuration; promote to production. If frames are unreadable: revert the follow-up PR.

### 6.7 Affected files (cross-reference for §2 table)

- `dashboard/next.config.ts` — **no edit in the upgrade PR.** In the follow-up PR, remove the `webpack:` block + the `productionBrowserSourceMaps: false` line (row 8 in §2.1).
- `dashboard/package.json` `"build"` script — edited in **both** PRs: in the upgrade PR add `--webpack` (row 4 in §2.1); in the follow-up PR drop `--webpack` (row 9 in §2.1).
- `dashboard/src/instrumentation.ts` — verify-only in the follow-up PR; no edit; confirm OTel traces are still readable post-deploy. (§2.2.)
- No CI change needed in either PR; `pnpm --filter dashboard build` continues to invoke whatever the `build` script does.

---

## 7. Dependency Compatibility Matrix

| Package | Current | Next 16-compatible version | Source / note |
| --- | --- | --- | --- |
| `next` | 15.4.11 | bump to `16.x` (latest stable) | https://nextjs.org/blog/next-16 |
| `react` | ^19.0.4 | ^19.0 (Next 16 ships its own canary internally) | https://nextjs.org/blog/next-16 |
| `react-dom` | ^19.0.4 | ^19.0 | same |
| `@types/react` / `@types/react-dom` | ^19 | bump to latest 19.x | **Required when on TypeScript** — the upgrade guide says: *"If you are using TypeScript, ensure you also upgrade `@types/react` and `@types/react-dom` to their latest versions."* (See §11.6 audit.) |
| `eslint-config-next` | 15.4.11 | bump to `^16.x` (must track `next`) | https://nextjs.org/docs/app/guides/upgrading/version-16 |
| `next-intl` | `4.3.4` | **No change in upgrade PR.** `4.3.4` is functionally compatible with Next 16: release-note review across 4.3.4 → 4.11.0 shows no breaking changes to any API we use (`createMiddleware`, `createNavigation`, `defineRouting`, `getRequestConfig`, `hasLocale`, `getLocale`, `getTranslations`, `useLocale`, `useTranslations`, `NextIntlClientProvider`). The original 4.11.0 pin (user direction 2026-05-02) was overturned 2026-05-09 in favor of keeping the upgrade PR lean; a future bump is an independent decision. Works with Next 16 via `proxy.ts`. | https://next-intl.dev/docs/routing/middleware (shows proxy-style examples). |
| `next-auth` | ^4.24.13 | functionally compatible per community reports; Auth.js v5 is the **recommended** path for new Next 16 apps but not required. | https://github.com/nextauthjs/next-auth/issues/13302 (compatibility issue thread); v5 migration: https://authjs.dev/getting-started/migrating-to-v5 |
| `@trpc/client` / `@trpc/react-query` / `@trpc/server` | ^11.16.0 | ^11.x compatible | https://trpc.io/docs/client/nextjs |
| `@tanstack/react-query` | ^5.74.4 | unchanged | unaffected by Next 16 |
| `@vercel/otel` | ^2.1.0 | unchanged. Confirm at upgrade. | unaffected by Next 16 directly; relevant to webpack-hook decision (§6). |
| `next-themes` | ^0.4.6 | likely OK with React 19.x; community has flagged React 19 peer-range issues historically. Post-migration smoke-test in Phase 3 confirms light/dark toggle works (per user direction, 2026-05-02). | https://github.com/pacocoursey/next-themes/issues/296 |
| `nextjs-toploader` | ^3.8.16 | peer range is permissive (`next: >= 6.0.0`); should work but **not officially listed** as Next 16-tested. Post-migration smoke-test in Phase 3 confirms top-of-page progress bar still appears on route changes (per user direction, 2026-05-02). | https://www.npmjs.com/package/nextjs-toploader |
| `tailwindcss` / `@tailwindcss/postcss` | ^4 | unaffected | Tailwind v4 is independent of Next major. |
| `eslint` | ^9.39.2 | OK; flat config required (already in use) | upgrade guide |
| `@next/eslint-plugin-next` | (transitive via eslint-config-next) | tracks `next` major | upgrade guide |
| `@next-auth/prisma-adapter` | ^1.0.7 | unaffected (Prisma + DB adapter, decoupled from Next) | n/a |
| `eslint-plugin-react-hooks` / `eslint-plugin-react` | ^5.2.0 / ^7.37.5 | unaffected | n/a |

`docs/` package: **out of scope for this plan.** It is deployed independently and can be upgraded on its own schedule.

---

## 8. Phased Migration Plan

The plan is split across two PRs (the **upgrade PR** and the **webpack-removal follow-up PR**) and then a third bucket of unrelated optional follow-ups.

- Phases 0–3 belong to the **upgrade PR**.
- Phase 5 is a single-PR phase covering the **webpack-removal follow-up PR**.
- Phase 4 is the catch-all bucket for *unrelated* optional follow-ups (Cache Components, React Compiler, Auth.js v5, `unstable_cache` migration, `--turbopack` flag cleanup) — each shipped as its own PR after the upgrade lands.

### Phase 0 — Prep (no Next.js changes)

| Task | Risk | Test | Rollback |
| --- | --- | --- | --- |
| Confirm Node 20.9+ everywhere it matters: dev machines, `dashboard/Dockerfile` (already `node:20-slim` — verify image tag resolves to ≥20.9), `.github/workflows/pr-checks.yml` (`node-version: "20"` is fine if it resolves to 20.9+; pin to `"20.9"` or `"20.x"` if necessary). | low | `node --version` in container; run CI smoke test | revert workflow / Dockerfile |
| Run `pnpm dlx @next/codemod@canary next-lint-to-eslint-cli .` against `dashboard/` to convert the lint script. Verify `pnpm lint` still works on `next@15`. | low | `pnpm lint` clean | revert codemod commit |
| Re-read `.github/workflows/pr-checks.yml` end-to-end to confirm the `Lint check` step (`pnpm --filter dashboard lint`) keeps working after the script swap. | low | n/a | n/a |
| Create a branch off `main` (we already have `task/nextjs-16-migration-plan` for the plan; the actual work would happen on a separate branch like `chore/nextjs-16-upgrade`). | n/a | n/a | n/a |

**Verification:** `pnpm install`, `pnpm --filter dashboard build`, `pnpm --filter dashboard unit-tests` all green on `next@15` with the prep changes. Smoke-test `pnpm --filter dashboard dev` locally.

### Phase 1 — Run the upgrade codemod & dependency bump

| Task | Risk | Test | Rollback |
| --- | --- | --- | --- |
| `pnpm --filter dashboard add next@latest react@latest react-dom@latest` and bump `eslint-config-next` to a matching `^16.x`, plus `@types/react` / `@types/react-dom` to latest. | medium | `pnpm install` resolves; lockfile clean. | `git checkout -- pnpm-lock.yaml dashboard/package.json` |
| Run `pnpm dlx @next/codemod@canary upgrade latest` from the `dashboard/` directory. Inspect the diff carefully. The codemod is expected to: rename middleware → proxy, add `await` to any sync request-API call (no-op for us), drop `unstable_` prefixes (we don't use them), and clean up the `next.config.ts` Turbopack section (no-op for us). | medium | review diff, then `pnpm build` | revert the codemod commit |
| **Edit `dashboard/package.json` `"build"` script** from `"next build && pnpm run build:worker"` → `"next build --webpack && pnpm run build:worker"`. Preserves the existing `webpack:` hook in `next.config.ts` while Next 16's default switches to Turbopack. (Row 4 in §2.1.) | low | `pnpm --filter dashboard build` exits 0; the worker bundle is still produced at `.next/standalone/worker.js` | revert the script edit |

### Phase 2 — Manual fix-ups Next 16 codemod cannot do

| Task | Risk | Test | Rollback |
| --- | --- | --- | --- |
| `next.config.ts`: **no edit in this PR.** The `webpack:` block and `productionBrowserSourceMaps: false` are kept; their removal is the entire scope of the follow-up PR (Phase 5). With `--webpack` added to the build script in Phase 1, the existing hook applies as before and there is no R1 risk in this PR. | n/a | n/a | n/a |
| `dashboard/src/app/layout.tsx`: add `data-scroll-behavior="smooth"` on the root `<html>` element. | low | manual nav between routes; observe scroll-to-top is smooth (matches old behavior) | remove attribute |
| Verify proxy.ts location after codemod, and that `next-intl`'s `createMiddleware` import path is unchanged. | low | manual: visit `/`, `/da`, `/it`, `/nb`, `/dashboard/...` — locale prefix logic should be untouched | rename file back |
| Decide on `images.minimumCacheTTL`: accept new 4h default OR set `images: { minimumCacheTTL: 60 }`. | low | n/a (cache-time only) | flip the config value |
| Decide on `images.qualities`: leave default `[75]` (we don't pass `quality` props) | low | n/a | n/a |

### Phase 3 — Verification & rollout (Upgrade PR)

| Task | Risk | Test | Rollback |
| --- | --- | --- | --- |
| `pnpm --filter dashboard build` (production). | low | exit 0 | revert |
| `pnpm --filter dashboard unit-tests`. | low | all tests green | n/a |
| Manual smoke-test list (run locally against staging DB): | medium | (see checklist below) | revert |
| Build the Docker image (`dashboard/Dockerfile`) and run it standalone. Verify `/api/metrics`, `/api/auth/[...nextauth]`, `/api/webhooks/stripe`, locale prefix routing, sign-in flow, dashboard page load, errors page load. | medium | manual smoke | revert |
| Deploy to staging, observe for 24-48h. Watch error rates, image-optimizer error logs. **Note:** server stack-frame readability in OTel is **unchanged from today** in this PR (the webpack hook is still in place); the Turbopack-source-map question (R1b) is verified in Phase 5, not here. | medium | metrics dashboards | redeploy previous tag |
| Promote to production. | medium | metrics dashboards | redeploy previous tag |

**Manual smoke-test checklist (Upgrade PR):**
- [ ] Public pages render in all 4 locales (`en`, `da`, `it`, `nb`).
- [ ] Locale switch in the public footer works.
- [ ] Sign-up, sign-in, sign-out, password reset, email verification, MFA / TOTP setup.
- [ ] Stripe checkout success page (`/billing/success`) renders.
- [ ] Stripe webhook endpoint (`/api/webhooks/stripe`) receives + verifies events. (`headers()` is awaited correctly.)
- [ ] Dashboard list, dashboard detail, errors detail, monitoring detail, settings (members, integrations, MCP, rules), session replay.
- [ ] Sitemap + robots accessible.
- [ ] Worker still builds (`pnpm --filter dashboard build:worker`) and runs. (Confirms the `&& pnpm run build:worker` chain in the new `--webpack` build script still works.)
- [ ] tRPC routes return JSON over the new build.
- [ ] Build the standalone Docker image and confirm `/app/.next/standalone/server.js` plus dependencies are present; container starts and serves `/api/metrics` and the auth handler. (Resolves former §10 question 3.)
- [ ] `nextjs-toploader` top-of-page progress bar still appears on route changes. (Resolves former §10 question 5.)
- [ ] `next-themes` light/dark theme toggle still works without flicker or hydration warnings. (Resolves former §10 question 5.)

### Phase 4 — Unrelated optional follow-ups (separate PRs)

These are **not** part of the Next.js 16 upgrade and **not** the webpack-removal follow-up. Each is its own PR.

- Evaluate `cacheComponents: true` + `'use cache'` directive in selected high-traffic public pages.
- Evaluate `reactCompiler: true`. Requires installing `babel-plugin-react-compiler`, expect slower builds. Benchmark first.
- Migrate `dashboard/src/auth/api-auth.ts:executeWithDemoCache` from `unstable_cache` to `cacheLife` + `cacheTag`.
- Migrate `next-auth` v4 → Auth.js v5. Big change in surface area (`getServerSession` → `auth()`, adapter package rename `@next-auth/...` → `@auth/...`). **Do not bundle with the Next.js 16 upgrade.**
- Drop the now-redundant `--turbopack` flag from `dashboard/package.json` `"dev"` (cosmetic-only; Turbopack is already the dev default in 16).

### Phase 5 — Webpack-hook removal (dedicated follow-up PR)

This phase is a single PR (`chore/nextjs-16-drop-webpack-hook`) that lands after the upgrade PR is merged and stable in production. It is the only place in the plan where the `webpack:` block is touched.

| Task | Risk | Test | Rollback |
| --- | --- | --- | --- |
| `dashboard/next.config.ts`: remove the `webpack: (config, { isServer }) => { ... }` block **and** the `productionBrowserSourceMaps: false` line (see §6). (Row 8 in §2.1.) | **HIGH (R1b)** — single most likely failure point of the entire migration | `pnpm --filter dashboard build` succeeds; staging OTel traces still produce readable server stack frames per §6.6 | revert this PR (single-revert; upgrade PR remains in place) |
| `dashboard/package.json`: drop `--webpack` from `"build"` so production builds run on Turbopack defaults. (Row 9 in §2.1.) | medium (paired with the row above; isolated risk is build-time only) | `pnpm --filter dashboard build` exits 0; build wall-clock improves to Turbopack speeds | revert this PR |
| Deploy to staging. Run the §6.6 verification (inspect `.js.map` files in standalone output; throw a typed server error and confirm OTel exception spans still resolve to `dashboard/src/...` source positions). | medium | staging OTel traces remain readable | revert this PR |
| Promote to production once §6.6 verification passes. | medium | production metrics dashboards | redeploy previous tag |

**Phase 5 smoke-test checklist (delta from Phase 3):**
- [ ] OTel: a deliberately-thrown server error produces a readable stack frame pointing at `dashboard/src/...` in the trace.
- [ ] `dashboard/.next/standalone/.next/server/` contains `.js.map` files for the server bundle (or the equivalent under Turbopack's output layout).
- [ ] Production build wall-clock improved (informational; no hard threshold).

---

## 9. Risk Register (specific to this codebase)

| # | Risk | Likelihood | Impact | Mitigation | PR |
| --- | --- | --- | --- | --- | --- |
| R1 | Custom `webpack:` config blocks `next build` under Turbopack-by-default. | **Neutralized in the upgrade PR** by passing `--webpack` to `next build` (§2.1 row 4, §8 Phase 1). The block is preserved verbatim and the build runs on webpack as before. The risk is fully retired once the follow-up PR (Phase 5) removes the block. | n/a (mitigated structurally) | Upgrade PR: change `"build"` script to `"next build --webpack && pnpm run build:worker"`. Follow-up PR: remove the block and the `--webpack` flag together. | Upgrade |
| R1b | **Headline risk for the follow-up PR.** After dropping the `webpack:` block, server stack traces in OTel become unreadable (Turbopack default doesn't emit usable server source maps for our setup). | Low-Medium | Debug-time pain — observability degrades; opaque chunk identifiers in production traces. | Verify on staging post-deploy per §6.6 *before* promoting the follow-up PR to production. If regression occurs, revert the follow-up PR; we remain on Next 16 with the webpack hook intact (single-PR rollback per §6.5). | **Follow-up** |
| R2 | `proxy.ts` rename interacts with `next-intl`'s middleware factory in a non-obvious way (e.g. detection of the named export changes locale-routing behavior). | Medium | Locale prefixes break for some routes — affects every public page. | Smoke-test all 4 locales and the matcher (`/((?!api|_next|.*\\..*|dashboard|dashboards|billing).*)`). Note: keeping `middleware.ts` as a fallback is a *temporary* safety net only — that filename is scheduled for removal in a future Next.js minor (per blog § "`proxy.ts`"). | Upgrade |
| R3 | `proxy.ts` is **Node.js runtime only**. If we (or `next-intl`) implicitly relied on edge behavior (e.g. cold-start latency expectations, edge-only globals), behavior changes. | Low | Latency increase on the proxy path. | We did not opt into edge runtime in `middleware.ts`, so net change is small. Monitor request latency post-deploy. | Upgrade |
| R4 | `next-auth` v4.24.x edge cases under the Next 16 routing rewrite. The community issue thread (#13302) mentions install/compat friction; runtime should be fine but the API-route path `/api/auth/[...nextauth]/route.ts` should be smoke-tested. | Medium | Sign-in flow regressions. | Manual auth smoke-test in staging. Have an Auth.js v5 follow-up plan ready. | Upgrade |
| R5 | `unstable_cache` semantics in 16 differ subtly. The dashboard's demo-mode caching (`auth/api-auth.ts:84`) is the only consumer; if that drifts, demo dashboards may show stale or duplicated data. | Low | Demo-mode user confusion. | Smoke-test the demo dashboards. Plan migration to `cacheLife`/`cacheTag` later. | Upgrade |
| R6 | `output: 'standalone'` Docker build picks up an unexpected change in 16's standalone tracer (e.g. missing files in `/app/.next/standalone`). | Medium | Container starts but missing modules at runtime. | Build the image in CI as part of the upgrade PR; run it. Have the previous image tag pinned for rollback. | Upgrade |
| R7 | `data-scroll-behavior="smooth"` mismatch with `next-themes` `suppressHydrationWarning` interaction (theme hook also writes to `<html>`). | Low | Hydration warnings or theme flicker. | The attribute is static; no theme-driven swapping. Smoke-test light/dark toggle. | Upgrade |
| R8 | Image optimizer changes (`minimumCacheTTL: 4h`) cause stale logos/favicons during hot iteration. | Low | Mostly cosmetic, only visible at edits to assets. | Document in PR; bust cache via filename versioning if needed. | Upgrade |
| R9 | `generateStaticParams` patterns under `[locale]/(public)/` and `[locale]/(public)/vs/[competitor]/` need to keep returning the right shape for SSG. (Three call sites: `dashboard/src/app/[locale]/(public)/layout.tsx:17`, `dashboard/src/app/[locale]/(public)/vs/[competitor]/page.tsx:30`, `dashboard/src/app/[locale]/(signup)/layout.tsx:15`.) | Low | Wrong locale variants pre-rendered, or competitor pages 404. | Build and inspect the static page list in `.next/server/app/`. | Upgrade |
| R10 | Sitemap dynamic generation — `dashboard/src/app/sitemap.ts` reads `env.PUBLIC_BASE_URL` at request time; in 16, dynamic env reads may need `connection()`. | Low | Sitemap shows wrong base URL on the first request after deploy. | The page already runs at request time (no `'use cache'`), so behavior should be unchanged. Verify the rendered XML once. | Upgrade |
| R11 | `proxy.ts` runs on Node runtime but the matcher excludes `dashboard/dashboards/billing` — if the matcher was relying on edge-only request normalization (e.g. trailing-slash treatment), behavior shifts. | Low | Subtle 404s on edge cases of dashboard URLs. | Smoke-test the matcher exclusions in staging. | Upgrade |
| R12 | `eslint-config-next@16` may introduce new rules that fail CI. | Low | Lint failures block the PR. | Treat new failures as warnings (`--max-warnings`) initially, then fix in a follow-up. | Upgrade |

---

## 10. Open Questions / Things I Could Not Verify

All material open questions have been resolved by user input on 2026-05-02. The remaining unknowns are handled as post-migration verification steps in §8 Phase 3 and as the post-deploy verification described in §6.6.

1. **Exact `next-intl` minimum version recommended for Next 16.** Resolved (user, 2026-05-09): **no bump** in the upgrade PR. `4.3.4` is verified compatible with Next 16 via release-note review across 4.3.4 → 4.11.0 — no breaking changes to any API we use. The earlier 2026-05-02 decision to pin `^4.11.0` has been superseded; a future `next-intl` bump is an independent decision, separate from the framework upgrade. Reflected in §2.1 (row 1), §7, §8 Phase 1, and §11.5.
2. **Turbopack server source-map output in production.** **Now a follow-up-PR concern, not an upgrade-PR concern.** Updated direction: the upgrade PR keeps the `webpack:` block and passes `--webpack` to `next build`, so server stack-trace readability is unchanged from today during the framework bump. Turbopack's server source-map behavior (R1b) is investigated in the dedicated `chore/nextjs-16-drop-webpack-hook` follow-up PR (§8 Phase 5), with verification per §6.6. The fall-back for the follow-up PR is to revert it (single-revert, single PR) — the upgrade itself is unaffected. Reflected in §6.5, §6.6, §8 Phase 5, and risks R1 / R1b.
3. **`output: 'standalone'` change-list in 16.** Resolved (user, 2026-05-02): verify after migrating; added to the §8 Phase 3 manual smoke-test checklist (standalone Docker container check).
4. **Whether `unstable_cache` is silently deprecated in 16.** Resolved (user, 2026-05-02): `unstable_cache` is still supported in Next 16; the upstream "Note" recommends migrating to `'use cache'` or the patterns at https://nextjs.org/docs/app/getting-started/caching as a follow-up. Reflected in §5.5 and §8 Phase 4.
5. **`nextjs-toploader` and `next-themes` peer-range / runtime correctness on Next 16 + React 19.2.** Resolved (user, 2026-05-02): test post-migration. Added as smoke-test items to the §8 Phase 3 checklist (toploader visible on route changes; light/dark toggle works).
6. **`docs/` package — out of scope.** Nextra's compatibility with Next 16 is a separate effort, not addressed here.

---

## 11. Audit: What's Actually Required

This audit answers the question "are there any unnecessary changes for this plan?" — i.e. things flagged in §2.1 or §8 that could be cut from the **upgrade PR** without breaking the upgrade. Each item is checked against the Next.js 16 upgrade guide (https://nextjs.org/docs/app/guides/upgrading/version-16) and the Next.js 16 blog (https://nextjs.org/blog/next-16). Direct quotes are inlined below.

The categories are:
- **keep**: load-bearing for the upgrade PR.
- **defer**: not load-bearing for the upgrade PR; ship in a later, smaller PR.
- **cut**: not needed at all.

Bottom-line summary (one-liner per item):

| Item | Plan row | Verdict |
| --- | --- | --- |
| Drop `--turbopack` from dev script | §2.1 row 3 | **defer** (cosmetic; ship later or never) |
| Rename `middleware.ts` → `proxy.ts` | §2.1 row 6 | **keep** (codemod is free; deferral is also defensible — see below) |
| Add `data-scroll-behavior="smooth"` | §2.1 row 7 | **keep**, but label as *behavior-preservation*, not *required by 16* |
| Run `next-lint-to-eslint-cli` codemod | §8 Phase 0 | **keep** (codemod), but a one-line script swap is equivalent |
| Bump `next-intl` to `^4.11.0` | §2.1 row 1 | **SKIP** — accepted by user 2026-05-09; `4.3.4` stays |
| Bump `@types/react` / `@types/react-dom` | §2.1 row 1 | **keep** (upgrade guide phrases this as required when on TS) |

Details below.

### 11.1 Drop `--turbopack` from `dashboard/package.json` `"dev"` script (§2.1 row 3)

**What the plan currently says:** Phase 4 (optional) — drop the now-redundant `--turbopack` from `"dev": "next dev --turbopack"`.

**What's actually required:** Nothing. Quoting the upgrade guide directly: *"Previously you had to enable Turbopack using `--turbopack`, or `--turbo`. ... This is no longer necessary."* That's it — the existing `--turbopack` flag is a **no-op** in 16, not a build-blocker. The upgrade guide does not list it under "Removals." The flag continues to be parsed; it just doesn't change behavior because Turbopack is already the default.

**Verdict: defer (or cut entirely).** This row should not be in the upgrade PR. It's pure cosmetic cleanup with zero functional value. The plan already marks it Phase 4 (optional); §2.1 row 3 was updated above to label it explicitly as a nice-to-have, not part of the upgrade. If the user wants the dashboard's `package.json` to look idiomatic for 16, ship it as a one-line follow-up commit; otherwise leave it as-is — the flag will keep working until Vercel ever decides to remove `--turbopack` parsing entirely (no announced timeline).

### 11.2 Rename `middleware.ts` → `proxy.ts` (§2.1 row 6)

**What the plan currently says:** Phase 1 — rename the file and the named export. Codemod (`upgrade latest`) handles it.

**What's actually required for Next 16 to function:** Nothing forcing — `middleware.ts` is **deprecated, not removed** in 16. The upgrade guide says: *"The `middleware` filename is deprecated, and has been renamed to `proxy` to clarify network boundary and routing focus. The `edge` runtime is **NOT** supported in `proxy`. The `proxy` runtime is `nodejs`, and it cannot be configured. **If you want to continue using the `edge` runtime, keep using `middleware`.** We will follow up on a minor release with further `edge` runtime instructions."* The blog adds the future-removal language: *"The `middleware.ts` file is still available for Edge runtime use cases, but it is deprecated and will be removed in a future version."*

So strictly: a Next 16 build with `middleware.ts` left in place does **not** fail. We do not use `runtime: 'edge'` in `dashboard/src/middleware.ts` (verified in §5.2), so renaming is safe and gains us forward compatibility with whatever future minor removes `middleware.ts`.

**Both sides:**

- *Argument for keeping the rename in the upgrade PR:* (a) the codemod (`@next/codemod@canary upgrade latest`) handles the file rename, the named-export rename, and the `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize` config rename — zero manual work. (b) Renaming sooner avoids a future "emergency" PR when Next removes `middleware.ts`. (c) The diff is tiny and contained.
- *Argument for deferring it to a later PR:* (a) the user has a stated preference for lean upgrade PRs. (b) R2 ("`proxy.ts` interacts with `next-intl` middleware factory in a non-obvious way") is in the risk register; if it triggers, deferring would have isolated the regression from "the framework bump" — same logic that drove the webpack-block split. (c) `middleware.ts` keeps working on 16; we are not under time pressure.

**Verdict: keep — with caveat.** The codemod-driven rename is low-cost and removes future urgency. The R2 risk is low (we already mitigate via locale smoke-tests in §8 Phase 3). However, if the user wants maximum minimalism in the upgrade PR by symmetry with the webpack split, deferring this to a third small PR (`chore/nextjs-16-rename-middleware-to-proxy`) is a defensible second choice. Surfacing the tradeoff for user confirmation.

### 11.3 Add `data-scroll-behavior="smooth"` to root `<html>` (§2.1 row 7)

**What the plan currently says:** Phase 2 — add `data-scroll-behavior="smooth"` to the root `<html>` to *"preserve Next 15's auto-scroll-override behavior."*

**What's actually required for Next 16 to function:** Nothing. Quoting the upgrade guide: *"In **Next.js 16**, this behavior has changed. By default, Next.js will **no longer override** your `scroll-behavior` setting during navigation. **If you want Next.js to perform this override** (the previous default behavior), add the `data-scroll-behavior="smooth"` attribute to your `<html>` element."* The framework will not error and will not warn. The only consequence of inaction is that, since `dashboard/src/app/globals.css:267,273` sets `scroll-behavior: smooth` on `html`/`html.dark`, navigations will animate-scroll-to-top rather than instant-jump-to-top.

This is **a UX-preservation choice**, not an upgrade requirement.

**Verdict: keep, but relabel.** The fix is a single attribute and it preserves the behavior our users have today; cutting it would silently change navigation feel for every authenticated route. The plan should make explicit that this row is *behavior preservation* rather than *required by 16*. Acceptable alternatives — both equally valid for the upgrade itself: (a) add the attribute (the current recommendation, what we have); (b) remove the global `scroll-behavior: smooth` CSS rule entirely if we never wanted smooth nav-scroll in the first place. Either preserves a coherent UX; both are equally compatible with 16. The current plan recommends (a) and that recommendation stands.

### 11.4 Run the `next-lint-to-eslint-cli` codemod (§8 Phase 0)

**What the plan currently says:** Phase 0 — `pnpm dlx @next/codemod@canary next-lint-to-eslint-cli .` against `dashboard/`. Run *before* bumping next.

**What's actually required for Next 16 to function:** The `lint` script must no longer call `next lint` (because `next lint` is removed — quoting the upgrade guide: *"The `next lint` command has been removed. Use Biome or ESLint directly. `next build` no longer runs linting."*). The **codemod itself is optional**: *"A codemod is available to automate migration"* — note "available," not "required." Any equivalent ESLint invocation works.

`dashboard/eslint.config.mjs` already exists and is on Flat Config (verified in §3.1 / §5.10). The codemod's job in our case is essentially: rewrite `"lint": "next lint"` → `"lint": "eslint ."`. That is a single-line change a human can make in seconds.

**Verdict: keep, but the codemod is interchangeable with a one-line manual swap.** Either approach lands the same diff. Recommend keeping the Phase 0 codemod task as-is for habit and audit-trail, but flag in the plan that a manual `"lint": "eslint ."` is fully equivalent. No functional difference. This row stays in Phase 0.

### 11.5 Bump `next-intl` to `^4.11.0` (§2.1 row 1, §7)

**What the plan currently says:** §2.1 row 1 lists `next-intl` `^4.11.0` alongside the `next` / `react` / `eslint-config-next` bumps. §7 attributes the version pin to "user direction, 2026-05-02."

**What's actually required for Next 16 to function:** I checked the Next.js 16 upgrade guide end-to-end and the Next.js 16 blog post. **Neither mentions `next-intl` by name** and neither states a minimum `next-intl` version. The only concrete `next-intl`-relevant change in 16 is the `middleware.ts` → `proxy.ts` rename, and `next-intl`'s `createMiddleware` factory works identically against either filename (its docs show "Proxy / middleware" examples — the helper is unaffected by the filename). Our currently-pinned `4.3.4` does not, on its face, have a stated incompatibility with Next 16.

So the bump to `^4.11.0` is, on the evidence I can find, a **user-chosen version** rather than a Next-16-mandated upgrade. There may be a `next-intl` changelog reason to prefer `4.11.x` over `4.3.x` (bug fixes, perf, types), but that's an independent decision from the Next.js framework upgrade.

**Verdict: SKIP — accepted by user 2026-05-09.** The bump is not part of the upgrade PR and there is no committed plan to ship it later. `next-intl` stays at `4.3.4`. Compatibility was verified via release-note review across 4.3.4 → 4.11.0 (GitHub releases for `amannn/next-intl`): no breaking changes to any API the dashboard uses (`createMiddleware`, `createNavigation`, `defineRouting`, `getRequestConfig`, `hasLocale`, `getLocale`, `getTranslations`, `useLocale`, `useTranslations`, `NextIntlClientProvider`). The 4.x → 4.x range is feature-add and bug-fix only on this surface. Carrying the bump inside the Next 16 upgrade PR would have conflated two concerns ("does the dashboard run on Next 16" vs "are we on the latest `next-intl`"); skipping keeps the diff focused. A future bump can ship as its own one-line PR if and when the user wants it; this audit makes no recommendation either way on whether such a PR should happen.

### 11.6 Bump `@types/react` / `@types/react-dom` (§2.1 row 1, §7)

**What the plan currently says:** §2.1 row 1 — bump `@types/react` / `@types/react-dom` to latest. §7 calls this "recommended bump per upgrade guide."

**What's actually required:** The upgrade guide phrases this as a **required step** for TypeScript users: *"If you are using TypeScript, ensure you also upgrade `@types/react` and `@types/react-dom` to their latest versions."* The verb is "ensure," not "consider." The dashboard is on TypeScript (`typescript: ^5` in `package.json`), so this applies.

In practice: with `react`/`react-dom` bumped to latest 19.x, type definitions need to match, otherwise you can hit subtle component-prop type mismatches at compile time (especially around new React 19.2 types like `ViewTransition`). Failing to bump can mean confusing `tsc` errors that aren't really framework bugs.

**Verdict: keep, and re-label from "recommended" to "required (when on TypeScript)".** The plan's §7 wording ("recommended bump per upgrade guide") under-states this; the upgrade guide's own wording is firmer. §7 should be tightened to match.

### 11.7 Things the audit explicitly did *not* find unnecessary

For completeness — these stay in the upgrade PR exactly as the plan currently has them, with no audit objection:

- **`next` / `react` / `react-dom` / `eslint-config-next` bumps** (§2.1 row 1): obviously load-bearing.
- **Updating `"build"` script to add `--webpack`** (§2.1 row 4 — added by Part 1 of this audit): load-bearing for the upgrade PR specifically because we are *not* dropping the webpack hook in the upgrade PR.
- **Renaming `middleware.ts` → `proxy.ts`** (§2.1 row 6): see §11.2 — recommend keep, with a noted alternative.
- **`pnpm-lock.yaml` regeneration** (§2.1 row 5): automatic side effect, can't be cut.

### 11.8 Honest accounting

The audit produces three concrete cuts/defers and four "keep, with refinements":

- **Defer:** `--turbopack` flag removal from dev script.
- **Skip:** `next-intl` bump to `^4.11.0`. Accepted by user 2026-05-09; `4.3.4` stays. No future bump is committed.
- **Defer (alternative, lower-conviction):** `middleware.ts` → `proxy.ts` rename. Recommend keeping in upgrade PR; surfacing the deferral option for symmetry with the webpack split.
- **Keep, relabel:** `data-scroll-behavior="smooth"` (label as behavior-preservation, not required).
- **Keep, sharpen wording:** `@types/react*` bump (re-label "recommended" → "required when on TypeScript").
- **Keep, with note:** `next-lint-to-eslint-cli` codemod (manual one-line swap is equivalent).
- **Keep:** every other row in §2.1.

Nothing on the upgrade-PR side of §2.1 turned out to be wholly unnecessary in the "this isn't actually a Next 16 thing at all" sense.

---

## Source Index

- Next.js 16 release blog: https://nextjs.org/blog/next-16
- Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js 16 codemods page: https://nextjs.org/docs/app/guides/upgrading/codemods
- Renaming Middleware to Proxy: https://nextjs.org/docs/messages/middleware-to-proxy
- `proxy.js` file conventions: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Turbopack config reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
- `next-intl` proxy/middleware page: https://next-intl.dev/docs/routing/middleware
- Auth.js v5 migration: https://authjs.dev/getting-started/migrating-to-v5
- next-auth issue #13302 (Next 16 compat thread): https://github.com/nextauthjs/next-auth/issues/13302
- `next-themes` React 19 thread: https://github.com/pacocoursey/next-themes/issues/296
- `nextjs-toploader`: https://www.npmjs.com/package/nextjs-toploader
- React 19.2 announcement: https://react.dev/blog/2025/10/01/react-19-2
- PR #585 — added the `webpack:` source-map hook: https://github.com/betterlytics/betterlytics/pull/585 (commit `c7b1533`)
- TC39 debug IDs proposal (referenced by Turbopack `debugIds`): https://github.com/tc39/ecma426/blob/main/proposals/debug-id.md
- `unstable_cache` API reference (cited in §5.5): https://nextjs.org/docs/app/api-reference/functions/unstable_cache
- Next.js caching guide (cited in §5.5 — recommended migration target for `unstable_cache`): https://nextjs.org/docs/app/getting-started/caching
