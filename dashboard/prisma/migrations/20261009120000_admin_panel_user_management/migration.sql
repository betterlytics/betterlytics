-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "disabledAt" TIMESTAMP(3);

-- MigrateData: seed "lastActiveAt" from the newest session refresh, the closest signal we have today
UPDATE "User" u
SET "lastActiveAt" = s."lastActiveAt"
FROM (SELECT "userId", MAX("updatedAt") AS "lastActiveAt" FROM "Session" GROUP BY "userId") s
WHERE s."userId" = u."id";

-- Generalize the super admin audit log so self-host instance admins are recorded too
ALTER TYPE "SuperAdminAuditStatus" RENAME TO "AdminAuditStatus";

-- CreateEnum
CREATE TYPE "AdminActorKind" AS ENUM ('super_admin', 'instance_admin');

ALTER TABLE "SuperAdminAuditLog" RENAME TO "AdminAuditLog";
ALTER TABLE "AdminAuditLog" RENAME CONSTRAINT "SuperAdminAuditLog_pkey" TO "AdminAuditLog_pkey";
ALTER INDEX "SuperAdminAuditLog_actorUserId_idx" RENAME TO "AdminAuditLog_actorUserId_idx";
ALTER INDEX "SuperAdminAuditLog_createdAt_idx" RENAME TO "AdminAuditLog_createdAt_idx";

-- AlterTable
ALTER TABLE "AdminAuditLog" ADD COLUMN     "actorKind" "AdminActorKind" NOT NULL DEFAULT 'super_admin',
ADD COLUMN     "actorLabel" TEXT,
ADD COLUMN     "targetLabel" TEXT;

ALTER TABLE "AdminAuditLog" ALTER COLUMN "actorKind" DROP DEFAULT;
