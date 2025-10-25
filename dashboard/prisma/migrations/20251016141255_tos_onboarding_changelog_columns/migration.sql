-- AlterTable
ALTER TABLE "User" ADD COLUMN     "changelogVersionSeen" INTEGER DEFAULT 0,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedVersion" INTEGER;


UPDATE "User" u
SET "onboardingCompletedAt" = sub.min_created
FROM (
  SELECT "userId", MIN("createdAt") AS min_created
  FROM "UserDashboard"
  GROUP BY "userId"
) AS sub
WHERE sub."userId" = u."id"
  AND u."onboardingCompletedAt" IS NULL;