-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'expired');

-- AlterTable
ALTER TABLE "DashboardInvitation" ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "DashboardInvitation_status_idx" ON "DashboardInvitation"("status");
