-- Ended memberships are kept for the access audit trail, so the one-row-ever unique key goes away
-- DropIndex
DROP INDEX "UserDashboard_userId_dashboardId_key";

-- AlterTable
ALTER TABLE "UserDashboard" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- CreateIndex
-- Partial unique index: one live (non-soft-deleted) membership per user and dashboard, so a removed
-- member can be re-invited into a new row. Prisma can't express the WHERE clause, so it lives here.
CREATE UNIQUE INDEX "UserDashboard_userId_dashboardId_key" ON "UserDashboard"("userId", "dashboardId") WHERE "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "UserDashboard" ADD CONSTRAINT "UserDashboard_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
