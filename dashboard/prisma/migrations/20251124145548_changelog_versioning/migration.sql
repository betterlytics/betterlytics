-- AlterTable
ALTER TABLE "User" ALTER COLUMN "changelogVersionSeen" SET DEFAULT 'v0',
ALTER COLUMN "changelogVersionSeen" SET DATA TYPE TEXT;
