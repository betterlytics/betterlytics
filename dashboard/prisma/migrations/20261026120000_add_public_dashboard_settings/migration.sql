-- AlterTable
ALTER TABLE "Dashboard" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicEnabledPages" TEXT[] DEFAULT ARRAY['overview']::TEXT[],
ADD COLUMN     "publicSlug" TEXT;

-- Partial unique index: a slug is unique only among live (non-soft-deleted) dashboards, so deleting
-- a dashboard (directly or through account deletion) frees its slug. Prisma can't express the WHERE
-- clause, so it lives here.
CREATE UNIQUE INDEX "Dashboard_publicSlug_key" ON "Dashboard"("publicSlug") WHERE "deletedAt" IS NULL;
