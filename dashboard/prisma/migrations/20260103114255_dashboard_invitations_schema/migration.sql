-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DashboardRole" ADD VALUE 'owner';
ALTER TYPE "DashboardRole" ADD VALUE 'member';

-- NOTE: Run a separate migration or SQL to convert admins to owners:
-- UPDATE "UserDashboard" SET "role" = 'owner' WHERE "role" = 'admin';

-- CreateTable
CREATE TABLE "DashboardInvitation" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "DashboardRole" NOT NULL DEFAULT 'viewer',
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardInvitation_token_key" ON "DashboardInvitation"("token");

-- CreateIndex
CREATE INDEX "DashboardInvitation_email_idx" ON "DashboardInvitation"("email");

-- CreateIndex
CREATE INDEX "DashboardInvitation_token_idx" ON "DashboardInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardInvitation_dashboardId_email_key" ON "DashboardInvitation"("dashboardId", "email");

-- AddForeignKey
ALTER TABLE "DashboardInvitation" ADD CONSTRAINT "DashboardInvitation_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardInvitation" ADD CONSTRAINT "DashboardInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
