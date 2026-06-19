-- A custom domain can be claimed by at most one live (non-soft-deleted) status page, mirroring the
-- slug constraint. Prisma can't express the partial WHERE clause, so the index lives here. NULL
-- customDomains are excluded, so pages without a custom domain never collide.
CREATE UNIQUE INDEX "StatusPage_customDomain_key" ON "StatusPage"("customDomain") WHERE "customDomain" IS NOT NULL AND "deletedAt" IS NULL;
