-- Status page: search-engine visibility, homepage link target, and custom domain.
-- visibility: 'public' (indexed) | 'unlisted' (noindex). homepageUrl/customDomain are nullable.
-- customDomain is stored only for now; routing, ownership verification and TLS are not wired up yet.
ALTER TABLE "StatusPage" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'public';
ALTER TABLE "StatusPage" ADD COLUMN "homepageUrl" TEXT;
ALTER TABLE "StatusPage" ADD COLUMN "customDomain" TEXT;
