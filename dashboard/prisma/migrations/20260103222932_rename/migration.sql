/*
  Warnings:

  - The values [member] on the enum `DashboardRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DashboardRole_new" AS ENUM ('owner', 'admin', 'editor', 'viewer');
ALTER TABLE "DashboardInvitation" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "UserDashboard" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "UserDashboard" ALTER COLUMN "role" TYPE "DashboardRole_new" USING ("role"::text::"DashboardRole_new");
ALTER TABLE "DashboardInvitation" ALTER COLUMN "role" TYPE "DashboardRole_new" USING ("role"::text::"DashboardRole_new");
ALTER TYPE "DashboardRole" RENAME TO "DashboardRole_old";
ALTER TYPE "DashboardRole_new" RENAME TO "DashboardRole";
DROP TYPE "DashboardRole_old";
ALTER TABLE "DashboardInvitation" ALTER COLUMN "role" SET DEFAULT 'viewer';
ALTER TABLE "UserDashboard" ALTER COLUMN "role" SET DEFAULT 'viewer';
COMMIT;
