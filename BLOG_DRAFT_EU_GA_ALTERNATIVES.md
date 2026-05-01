# Top 10 Best EU Alternatives to Google Analytics — Blog Draft

This file contains:

1. **Competitor blog playbook** — what we learned from how umami, plausible, posthog, pirsch, and simpleanalytics actually structure their content.
2. **SEO strategy** — keyword cluster, target intent, and rationale.
3. **The draft post** — publication-ready first draft.
4. **Open questions / unverified claims**.
5. **Sources**.

---

## 1. Competitor blog playbook

A short synthesis from reading 8+ live posts across Plausible, PostHog, Pirsch, Simple Analytics, and Umami's site/blog indexes.

### Structure

- **Length is heavier than expected.** Plausible's GA4 transition guide and PostHog's "9 best GDPR-compliant analytics tools" both clear ~3,500 words; Plausible's "Everything that's complicated in GA than Plausible" is also ~3,500 words. Listicles in this niche cluster around 3,000–4,000 words because each tool needs ~250–400 words to be credible. Sources: [Plausible — GA to Plausible transition](https://plausible.io/blog/ga-to-plausible-transition), [PostHog — 9 best GDPR-compliant analytics tools](https://posthog.com/blog/best-gdpr-compliant-analytics-tools), [Plausible — Easy insights](https://plausible.io/blog/easy-insights).
- **Listicle skeleton (PostHog as the gold standard):** intro → "what GDPR-compliance actually requires" framing → comparison table (early, before tool deep-dives) → 9 tools, each with the same H3 sub-pattern: `Who is X for?` → `Features & benefits` → `X and GDPR compliance` → `How much does X cost?` → "Which should you choose?" decision section → FAQ block (10 Q&As). Source: [PostHog](https://posthog.com/blog/best-gdpr-compliant-analytics-tools).
- **Plausible's listicle uses a flatter structure:** "Criteria" → A–Z list of tools (each ~80–120 words) → "Final thoughts." Less depth per tool but higher tool count. Source: [Plausible — European privacy-friendly tools](https://plausible.io/blog/european-privacy-friendly-tools-for-business).
- **Intros do one job:** name the problem (GA4 complexity, consent rejection rates, Schrems II) in the first 2 sentences. PostHog opens by acknowledging that GDPR-compliant has "no universal legal definition" — this works because it sets the writer up as honest before pitching anything.

### Voice

- **First-person plural ("we") + second-person ("you")** is the dominant register across Plausible, Simple Analytics, and PostHog. Pirsch's interview-style post is the outlier (single-author "I"). Source: [Plausible — GA to Plausible transition](https://plausible.io/blog/ga-to-plausible-transition).
- **Tone is conversational-formal**, not casual-startup. No memes, no emoji-headlines. Technical depth is present but glossed for marketers (Plausible explains "engagement time" before claiming GA4 underreports it).
- **Self-mentions are restrained.** PostHog lists itself first in its own roundup but does so with a single neutral paragraph and a non-pushy "Install PostHog" callout near the end — not in every section. Plausible's transition guide says "we" but spends paragraphs acknowledging GA4 strengths. The tactic: earn the recommendation by being honest about competitor strengths.

### SEO patterns

- **Title format is keyword-led with a number.** "The 9 best GDPR-compliant analytics tools," "Top 10 Google Analytics Alternatives in 2026" — primary keyword first, count second, year optional. ([PostHog](https://posthog.com/blog/best-gdpr-compliant-analytics-tools), [OWOX](https://www.owox.com/blog/articles/top-google-analytics-alternatives)).
- **Meta descriptions** restate the keyword and add one differentiator (e.g., "GDPR-compliant," "EU-hosted," "for SaaS"). Length sits at 140–155 chars in the wild.
- **Comparison tables early** in the post (above the fold of the article body) — this seems to be the pattern that lifts the post into Google's "table" rich snippets. PostHog does this. Source: [PostHog](https://posthog.com/blog/best-gdpr-compliant-analytics-tools).
- **FAQ blocks are universal.** PostHog's 10-question FAQ at the end is clearly aimed at "People also ask" and FAQPage schema. Worth replicating.
- **Internal linking:** each tool entry deep-links to that tool's own product/pricing page (external) and to the publisher's own competitor pages (e.g., `/vs/plausible`). Plausible links to its own product comparisons; PostHog links to its docs.
- **External links to authority sources** for legal claims — noyb.eu, EDPB, CNIL — appear in the GDPR-framing intros. This is what gives the post legal credibility for "GDPR" search intent.

### Differentiation tactics (how they include themselves credibly)

- **PostHog**: places itself first but flags niche fit ("for product teams and startups") so a reader looking for a Plausible-style minimalist tool doesn't feel mis-sold.
- **Plausible**: in its tools roundup (where it self-includes), uses the exact same template and word count for itself as for Brevo, Mistral, etc. — formally identical treatment.
- **Pirsch**: rather than self-puffing, runs an external interview on Website Planet and republishes the summary — third-party validation is the rhetorical lift.
- **Simple Analytics**: writes news-format posts about competitors' GDPR problems ("German court rules Meta's tracking tech violates GDPR") so that readers arrive at Simple Analytics through a non-promotional door.

### Takeaway for the Betterlytics draft

- Aim for ~2,000 words for v1 (the brief sets 1,800–2,500), not 3,500. This is a first draft, and a tighter post finishes faster and is easier to review.
- Mirror PostHog's listicle skeleton: intro → criteria → comparison table → 10 tools with consistent sub-pattern → migration FAQ → conclusion.
- Place Betterlytics where the feature set warrants (#5–#7 zone), use the same word budget per tool, and lead each tool entry with its strengths before its weaknesses.
- Cite noyb / CNIL / EDPB inline in the intro — that's the move that signals "this isn't an ad."

---

## 2. SEO strategy

### Primary keyword (head term)

`EU alternatives to Google Analytics` — informational/commercial intent, mid-volume, low to medium difficulty. Used in title and H1.

### Long-tail cluster (5–10 variations)

Each long-tail is mapped to where it appears in the post — not just stuffed.

| Long-tail keyword | Where it appears | Rationale |
|---|---|---|
| `GDPR-compliant Google Analytics alternative` | H2: "How we picked these tools," intro paragraph | Highest commercial-intent variation; readers searching this are evaluating, not researching. |
| `EU-hosted privacy analytics for SaaS` | Tool sub-headers (e.g., "Best for: EU-hosted SaaS") | Matches the audience defined in the brief (mid-market SaaS). |
| `cookieless web analytics for EU companies` | Selection criteria section | Captures readers who already know they need to drop the cookie banner. |
| `Google Analytics 4 alternative without cookies` | Intro + each tool's "Cookies" line | Many "GA4 alternative" searchers add "without cookies" as a refinement. |
| `privacy-first analytics tool EU` | Conclusion + comparison table caption | Captures broader, less-commercial searches. |
| `how to migrate from Google Analytics to [tool]` | "How to migrate from GA4" FAQ section | Each variation seeds a future per-tool migration post and currently captures the migration intent cluster. |
| `is Google Analytics legal in the EU` | First H2 of the post (the legal context) | High-volume, low-commercial — but the click is exactly the reader we want, and the answer leads naturally into the listicle. |
| `Schrems II Google Analytics` | Inline in legal-context section | Authority-building; signals to Google we cover the topic with depth. |
| `best GA alternative for European business` | Conclusion CTA paragraph | Wraps the post for the actual purchasing-intent searcher. |
| `cookieless analytics no banner` | Comparison table column header | Ad-blocker-and-banner-fatigue search intent; converts well. |

**Density target:** primary keyword 4–6 times across H1, intro, two H2s, conclusion. Long-tails appear once each, in semantically natural positions. No stuffing.

**Internal links** (to add when published): `/features`, `/pricing`, `/vs/plausible`, `/vs/matomo`, `/vs/umami`, `/vs/posthog`, `/vs/fathom-analytics`, `/vs/google-analytics`, `/dpa`, `/privacy`.

**External authority links** (for trust and SEO): noyb.eu, edpb.europa.eu, the CNIL ruling page, the relevant Schrems II ruling reference.

**Schema:** add `Article` + `FAQPage` JSON-LD (the codebase already has a `StructuredData` component — see `dashboard/src/components/StructuredData.tsx` referenced from existing pages).

---

## 3. The draft post

> **Slug suggestion:** `/blog/eu-alternatives-to-google-analytics`
> **Word count:** ~2,150 words.

### Title (≤ 60 chars)

**Top 10 EU Alternatives to Google Analytics (2026)**
*(54 chars including spaces.)*

### Meta description (≤ 155 chars)

GDPR-compliant, EU-hosted analytics that replace GA4 — without cookie banners. We compare the 10 best European Google Analytics alternatives for 2026.
*(149 chars.)*

### Open Graph title / Twitter title

Top 10 EU Alternatives to Google Analytics (2026)

---

# Top 10 EU Alternatives to Google Analytics (2026)

If your business operates in the EU, Google Analytics is no longer a quiet, invisible default. It's a recurring legal question. Since the *Schrems II* ruling in 2020, data protection authorities in [Austria](https://noyb.eu/en/austrian-dsb-eu-us-data-transfers-google-analytics-illegal), [France (CNIL)](https://noyb.eu/en/update-cnil-decides-eu-us-data-transfer-google-analytics-illegal), and [Italy](https://www.edpb.europa.eu/news/national-news/2022/italian-sa-warns-against-use-google-analytics_en) have ruled specific deployments of Google Analytics unlawful, and [further DPAs](https://noyb.eu/en/update-further-eu-dpa-orders-stop-google-analytics) have issued similar orders since. The European Data Protection Supervisor even sanctioned the European Parliament for its use of Google Analytics on a COVID testing site.

The 2023 EU–US Data Privacy Framework offered a partial reset, but the underlying tension — US surveillance law versus EU data-protection rights — has not gone away, and the framework has faced [renewed legal challenges](https://noyb.eu/en/edps-sanctions-parliament-over-eu-us-data-transfers-google-and-stripe). For an EU-based founder, head of marketing, or DPO, the safer move is to stop the international transfer at the source: pick an analytics tool whose data never leaves the EU and that doesn't need consent in the first place.

This post lists the 10 best EU alternatives to Google Analytics for 2026, ranked on a transparent set of criteria. Full disclosure: Betterlytics is one of them. We've put it where its feature set actually places it, not at the top.

## How we picked these tools

To be on this list, a tool had to clear five gates:

1. **EU-hosted** — primary data centres in the EU or EFTA (Switzerland, Norway). Self-hosted-only tools count if you can run them on EU infrastructure.
2. **GDPR-ready by default** — no consent banner required for basic analytics. Cookieless or first-party-only.
3. **Cookieless tracking** — no cross-site identifiers, no fingerprinting that requires consent.
4. **Pricing transparency** — public pricing, no "contact sales" gate for SMB tiers.
5. **Active in 2026** — funded, maintained, and not in the "is this still alive?" bucket.

We weighted the ranking by feature breadth, ease of migration from GA4, and value at the SMB price band ($0–$30/month). Enterprise-only tools dropped down the list.

## At a glance

| Tool | Hosting | Starts at | Free tier | Cookieless | Self-host |
|---|---|---|---|---|---|
| Matomo | Frankfurt, DE (Cloud) / your infra | €29/mo Cloud, €0 self-host | Trial only on Cloud | Yes (config) | Yes |
| Plausible | EU (Estonia / European hosts) | $9/mo | 30-day trial | Yes | Yes |
| Pirsch | Germany | $6/mo | 30-day trial | Yes | No |
| Umami Cloud | Germany (EU region) | Free up to 1M events | Yes (1M events) | Yes | Yes |
| Betterlytics | Germany (Hetzner) | Free, then $7/mo | Yes (10K events) | Yes | Yes |
| Simple Analytics | Netherlands | €15/mo | Free plan | Yes | No |
| Fathom | Multi-region (incl. EU isolation) | $15/mo | 7-day trial | Yes | No |
| Piwik PRO | Sweden / DE / NL | €35/mo Business | 30-day trial | Yes (configurable) | Enterprise |
| PostHog | EU (Frankfurt) | Free up to 1M events | Yes | Yes (web mode) | Yes |
| Wide Angle Analytics | Germany | €4.90/mo | Trial | Yes | No |

Pricing checked in May 2026. Confirm on each vendor's site before publication.

---

### 1. Matomo — the full GA4 replacement

If your team migrated to GA4 and immediately missed the depth of Universal Analytics, Matomo is the closest like-for-like swap. It's the second-most-deployed analytics platform in the world after Google's, and the [French CNIL has explicitly endorsed](https://www.cnil.fr/en/cnil-publishes-mp-program-cookies-and-trackers-2024) configurations of Matomo as exemptable from consent.

- **Hosting:** Matomo Cloud is hosted in Frankfurt, Germany. Self-hosted runs anywhere you want. ([source](https://matomo.org/pricing/))
- **Pricing:** Cloud starts at €29/month for 50,000 hits. Self-hosted is free. ([source](https://matomo.org/pricing/))
- **Strength:** feature parity (and then some) with GA4 — heatmaps, A/B testing, funnels, session recording, custom reports, e-commerce.
- **Weakness:** the UI carries the weight of those features. Onboarding is the slowest on this list.
- **Best for:** mid-market businesses, regulated industries, and teams that need every report GA4 had.
- **Link:** [matomo.org](https://matomo.org)

![placeholder-screenshot-matomo.png](placeholder-screenshot-matomo.png)

### 2. Plausible — the simplicity benchmark

Plausible has done more than any other product to define what "privacy-first analytics" looks like in 2026: one screen, no funnel of configuration, no cookie banner. It's "made and hosted in the EU" with data processed exclusively on European-owned infrastructure ([source](https://plausible.io/data-policy)).

- **Hosting:** EU only. ([source](https://plausible.io/data-policy))
- **Pricing:** $9/month for 10,000 pageviews on the Starter plan. ([source](https://plausible.io/#pricing))
- **Strength:** the cleanest UX in the category. Customers who want "GA4 minus the noise" usually land here.
- **Weakness:** no session replay, no error tracking, no monitoring. By design — but it means a second tool when you outgrow the basics.
- **Best for:** content sites, marketing teams who don't need behavioral depth, and anyone allergic to dashboards.
- **Link:** [plausible.io](https://plausible.io)

![placeholder-screenshot-plausible.png](placeholder-screenshot-plausible.png)

### 3. Pirsch — German engineering, developer-friendly

Pirsch is built and hosted in Germany and leans hard into developer ergonomics: a clean API, a small script, server-side tracking via Go and Node SDKs. Its pricing is the most aggressive in this tier.

- **Hosting:** Germany. ([source](https://pirsch.io/pricing))
- **Pricing:** $6/month for 10,000 pageviews. ([source](https://pirsch.io/pricing))
- **Strength:** lowest price among the EU-hosted tier, strong developer SDK story, [explicitly positions on data residency](https://pirsch.io/blog/digital-sovereignty-in-europe-and-why-the-location-of-your-data-matters/).
- **Weakness:** smaller feature footprint than Matomo, and the brand is less recognizable to non-technical buyers.
- **Best for:** developer-led teams, agencies billing per-site, anyone who wants Plausible's simplicity at a lower price.
- **Link:** [pirsch.io](https://pirsch.io)

![placeholder-screenshot-pirsch.png](placeholder-screenshot-pirsch.png)

### 4. Umami — the open-source default

Umami is the open-source analytics project that most engineers reach for when they self-host. Umami Cloud now offers an EU (Germany) region with a generous free tier — 1 million events per month free, then usage-based ([source](https://docs.umami.is/docs/cloud)).

- **Hosting:** Umami Cloud in Germany; self-hosted anywhere.
- **Pricing:** free up to 1M events/month, usage-based after. ([source](https://docs.umami.is/docs/cloud))
- **Strength:** very generous free tier, MIT-licensed, large community, easy Docker deploy.
- **Weakness:** the cloud product is younger than Matomo's; advanced features (funnels, journeys) are less mature.
- **Best for:** engineering teams comfortable self-hosting, side projects, and SMBs with strong dev capacity.
- **Link:** [umami.is](https://umami.is)

![placeholder-screenshot-umami.png](placeholder-screenshot-umami.png)

### 5. Betterlytics — analytics + replay + monitoring in one

Disclosure: this is our product. Betterlytics is privacy-first analytics built on the same baseline as Plausible and Umami — cookieless, GDPR-ready, EU-hosted on Hetzner in Germany — but it bundles session replay, user-journey visualization, error tracking, and uptime monitoring into one dashboard. We list it here, not first, because for a marketing-only team Plausible is still simpler, and for a feature-parity-with-GA4 team Matomo is still deeper. Where Betterlytics wins is the bundle: replay + analytics + monitoring at one bill, with the same privacy posture across all of them.

- **Hosting:** Hetzner, Germany.
- **Pricing:** free tier up to 10,000 events/month, paid plans from $7/month.
- **Strength:** session replay and monitoring included at the entry tier; open-source ([github.com/betterlytics](https://github.com/betterlytics/betterlytics)); MCP server for AI agents.
- **Weakness:** newer brand than the top four; some advanced configurability (e.g., enterprise SSO) is on the roadmap rather than shipping.
- **Best for:** SaaS and e-commerce teams who want to consolidate three vendors into one without giving up the privacy story.
- **Link:** [betterlytics.io](https://betterlytics.io)

![placeholder-screenshot-betterlytics.png](placeholder-screenshot-betterlytics.png)

### 6. Simple Analytics — the cleanest compliance story

Simple Analytics is the choice for teams whose DPO wants the shortest possible answer to "what data are you collecting?" The answer is approximately none: no cookies, no IP storage, no fingerprints, data hosted in the Netherlands.

- **Hosting:** Netherlands. ([source](https://www.simpleanalytics.com/pricing))
- **Pricing:** free plan available; paid plans from €15/month. ([source](https://www.simpleanalytics.com/pricing))
- **Strength:** an unusually editorial blog and brand voice; the [posts on Meta's GDPR violations](https://www.simpleanalytics.com/blog/german-court-rules-meta-s-tracking-tech-violates-gdpr) read like trade journalism.
- **Weakness:** entry pricing is higher than Pirsch or Plausible's starter tier.
- **Best for:** privacy-sensitive industries (legal, healthcare, public sector) and teams whose primary buyer is a compliance officer.
- **Link:** [simpleanalytics.com](https://www.simpleanalytics.com)

![placeholder-screenshot-simpleanalytics.png](placeholder-screenshot-simpleanalytics.png)

### 7. Fathom Analytics — the polished US-built option with EU isolation

Fathom is Canadian-owned and globally hosted, but for EU customers it offers an "EU isolated" data path. *Unverified — confirm before publishing:* Fathom's docs reference EU isolation but we couldn't load the data-protection page during research; verify with their support.

- **Hosting:** multi-region with an opt-in EU-isolated mode (verify).
- **Pricing:** $15/month for 100,000 pageviews. ([source](https://usefathom.com/pricing))
- **Strength:** mature product, well-known brand among indie hackers, very polished UI.
- **Weakness:** the EU isolation is opt-in rather than the default, which can be a procurement-process drag.
- **Best for:** teams who already trust Fathom and need an EU-data option as a deal-breaker.
- **Link:** [usefathom.com](https://usefathom.com)

![placeholder-screenshot-fathom.png](placeholder-screenshot-fathom.png)

### 8. Piwik PRO — the enterprise pick

Piwik PRO descends from the same project that became Matomo but went a separate, enterprise-targeted direction. It's a GDPR-compliant analytics suite with consent management and a tag manager, hosted on EU-operated servers.

- **Hosting:** EU-operated (Sweden default, Germany / Netherlands on Enterprise). ([source](https://piwik.pro/pricing/))
- **Pricing:** Business from €35/month; Enterprise from €366/month annually. ([source](https://piwik.pro/pricing/))
- **Strength:** the only tool on this list with a built-in consent manager and tag manager bundled.
- **Weakness:** the price point excludes most SMBs; the UI is built for enterprise marketing ops.
- **Best for:** mid-market and enterprise marketing teams in regulated sectors.
- **Link:** [piwik.pro](https://piwik.pro)

![placeholder-screenshot-piwikpro.png](placeholder-screenshot-piwikpro.png)

### 9. PostHog (EU region) — analytics + product analytics in one

PostHog is a US-founded open-source product analytics platform, but its EU customers can select a Frankfurt-hosted instance at signup. It's a different shape from the others on this list — it covers product analytics, feature flags, session replay, and experiments — but for SaaS teams who already use one tool for both, PostHog deserves the slot.

- **Hosting:** Frankfurt, Germany if you select EU at signup. ([source](https://posthog.com/pricing))
- **Pricing:** free tier up to 1M events/month; usage-based after. ([source](https://posthog.com/pricing))
- **Strength:** widest feature set on this list — product analytics, replays, experiments, surveys.
- **Weakness:** US incorporation means CLOUD Act considerations remain; not a pure EU-DNA story for buyers who care.
- **Best for:** SaaS product teams who need event analytics, not just web analytics.
- **Link:** [posthog.com](https://posthog.com)

![placeholder-screenshot-posthog.png](placeholder-screenshot-posthog.png)

### 10. Wide Angle Analytics — the under-the-radar German option

Wide Angle is the most under-marketed product on this list, which is also why it's worth knowing: GDPR-compliant, German-hosted, custom-domain support, and the lowest published price we could find on a serious tool.

- **Hosting:** Germany.
- **Pricing:** from €4.90/month (verify on their site at publish time).
- **Strength:** custom domain support — your tracking script lives on `analytics.yourdomain.eu`, which sails past ad blockers.
- **Weakness:** smaller community, slower release cadence than the top tier.
- **Best for:** small EU-based agencies and indie operators who want EU hosting on the lowest possible budget.
- **Link:** [wideangle.co](https://wideangle.co)

![placeholder-screenshot-wideangle.png](placeholder-screenshot-wideangle.png)

---

## How to migrate from GA4

Switching analytics tools sounds painful. In 2026 it's mostly a one-evening job for a small site and a one-sprint job for a complex one. Here's the short version.

**1. Export your GA4 history.** GA4 lets you export reports to BigQuery; for everything else, take CSVs of your top dashboards. Most replacements (Plausible, Matomo, Umami) can import historical pageview data.

**2. Add the new script in parallel.** Don't cut over. Run GA4 and the new tool side-by-side for 2–4 weeks so you can sanity-check numbers. Expect the new tool to report 10–40% more sessions than GA4, because GA4 is missing the visitors who reject consent ([context](https://plausible.io/blog/consent-mode-ga4-modeled-data)).

**3. Re-implement custom events.** This is the biggest single task. Most teams have 10–30 custom events; a developer can re-implement them in a day. Tools like Plausible and Betterlytics use a single `track('event_name', { properties })` call.

**4. Update the cookie banner — usually by removing it.** If GA4 was the only consent-required tracker on your site, dropping it lets you remove the banner entirely (or at least drop the analytics category). Confirm with your DPO.

**5. Cut over and archive GA4.** Keep the GA4 property in read-only mode for as long as your data-retention policy requires; remove the script.

**Tool-specific migration guides** worth bookmarking: [Plausible's GA-to-Plausible guide](https://plausible.io/blog/ga-to-plausible-transition), Matomo's [GA importer](https://matomo.org/blog/2024/09/import-google-analytics-into-matomo/), and Pirsch's [migration docs](https://docs.pirsch.io).

## Conclusion: pick on hosting first, features second

Five years ago, the case for switching off Google Analytics was a value judgement. In 2026, for an EU business, it's also a risk-management one. The cheapest legal advice an EU founder can buy is to stop transferring visitor data to the US in the first place — and every tool on this list does exactly that.

If you want feature parity with the old GA, start with **Matomo**. If you want the cleanest possible UI, start with **Plausible**. If you want the analytics + replay + monitoring bundle on one bill, [start with Betterlytics — free up to 10,000 events](https://betterlytics.io/signup).

Whichever you pick: do the parallel-run period first. Numbers will look different, and you'll want to know exactly *how* different before your next board update.

---

## 4. Open questions / unverified claims

These need a fact-check pass before publication:

1. **Fathom EU isolation** — the data-protection page returned 404 during research. The "EU isolation" claim is widely repeated online but should be confirmed against current Fathom docs or by emailing their support. Marked unverified inline.
2. **Wide Angle Analytics pricing** (€4.90/mo) — taken from a third-party European-alternatives index, not directly from Wide Angle's pricing page. Confirm at publish time.
3. **Umami Cloud pricing** — pulled from a recent search summary referencing Umami docs (1M events free, then $0.00002/event). Confirm against `https://umami.is/pricing` directly before publish; Umami's pricing page wouldn't render fully through WebFetch.
4. **Pirsch script size** — the European-alternatives directory says "<1KB", Pirsch's own marketing has historically said similar; we did not include the number in the draft to avoid stating it without a primary source. Add it back if confirmed.
5. **CNIL endorsement of Matomo** — the CNIL has stated certain Matomo configurations are exempt from consent under specific conditions; we linked to the CNIL "MP program" page as a starting point. Replace with the most current CNIL guidance URL at publish time.
6. **Schrems II reach** — the post says "DPAs in Austria, France, and Italy" have ruled deployments unlawful. The noyb article is the source; the original DPA decision URLs should be linked alongside for primary-source rigor.
7. **Betterlytics' "$7/month" entry tier** — sourced from `betterlytics.io/pricing` via WebFetch; the page also shows a free tier of 10,000 events. Sanity-check that this is the current price at publish time.
8. **Screenshots** — all 10 placeholders need real screenshots captured at publish time.

## 5. Sources

### Legal / regulatory

- noyb — Austrian DSB ruling on GA: https://noyb.eu/en/austrian-dsb-eu-us-data-transfers-google-analytics-illegal
- noyb — CNIL ruling on GA: https://noyb.eu/en/update-cnil-decides-eu-us-data-transfer-google-analytics-illegal
- noyb — further DPAs ordering stop of GA: https://noyb.eu/en/update-further-eu-dpa-orders-stop-google-analytics
- noyb — EDPS sanctions Parliament: https://noyb.eu/en/edps-sanctions-parliament-over-eu-us-data-transfers-google-and-stripe
- EDPB — IMY orders Swedish companies to stop GA: https://www.edpb.europa.eu/news/national-news/2023/imy-orders-cdon-coop-dagens-industri-and-tele2-stop-using-google-analytics_en
- EDPB — coordinated approach on noyb 101 complaints: https://www.edpb.europa.eu/news/news/2023/edpb-promotes-consistent-approach-101-noyb-data-transfers-complaints_en

### Competitor blog posts read for the playbook

- PostHog — 9 best GDPR-compliant analytics tools: https://posthog.com/blog/best-gdpr-compliant-analytics-tools
- Plausible — GA-to-Plausible transition: https://plausible.io/blog/ga-to-plausible-transition
- Plausible — European privacy-friendly tools: https://plausible.io/blog/european-privacy-friendly-tools-for-business
- Plausible — Easy insights vs GA4: https://plausible.io/blog/easy-insights
- Plausible — Consent mode and GA4 modeled data: https://plausible.io/blog/consent-mode-ga4-modeled-data
- Pirsch — Digital sovereignty in Europe: https://pirsch.io/blog/digital-sovereignty-in-europe-and-why-the-location-of-your-data-matters/
- Pirsch — Website Planet interview: https://pirsch.io/blog/website-planet-interview/
- Simple Analytics — German court ruling on Meta: https://www.simpleanalytics.com/blog/german-court-rules-meta-s-tracking-tech-violates-gdpr
- Simple Analytics — EU cookie banner reform: https://www.simpleanalytics.com/blog/the-eu-wants-to-kill-cookie-banners-by-moving-consent-to-your-browser

### Pricing and hosting facts

- Plausible pricing/hosting: https://plausible.io/data-policy , https://plausible.io/#pricing
- Matomo pricing/hosting: https://matomo.org/pricing/
- Pirsch pricing: https://pirsch.io/pricing
- Umami Cloud docs: https://docs.umami.is/docs/cloud
- Simple Analytics pricing: https://www.simpleanalytics.com/pricing
- PostHog pricing: https://posthog.com/pricing
- Piwik PRO pricing: https://piwik.pro/pricing/
- Fathom pricing: https://usefathom.com/pricing
- Betterlytics pricing: https://betterlytics.io/pricing
- European Alternatives index (used to surface Wide Angle, Vantevo, etc.): https://european-alternatives.eu/alternative-to/google-analytics

### SEO/keyword research

- OWOX — Top 10 GA alternatives 2026: https://www.owox.com/blog/articles/top-google-analytics-alternatives
- WP Statistics — Is GA GDPR-compliant in 2026: https://wp-statistics.com/2025/09/is-google-analytics-gdpr-compliant/
- Vucense — Privacy-first analytics for 2026: https://vucense.com/privacy-sovereignty/digital-independence/privacy-analytics-alternatives-ga4-plausible-fathom-matomo-2026/
