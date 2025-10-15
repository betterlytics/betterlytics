-- AlterTable
ALTER TABLE "User" ADD COLUMN     "changelogVersionSeen" INTEGER DEFAULT 0,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedVersion" INTEGER;
