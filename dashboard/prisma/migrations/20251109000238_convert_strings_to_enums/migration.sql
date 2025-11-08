-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "AvatarMode" AS ENUM ('default', 'gravatar');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('growth', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "DashboardRole" AS ENUM ('admin', 'viewer');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR');

-- AlterTable UserSettings: Convert theme column
ALTER TABLE "UserSettings" ALTER COLUMN "theme" DROP DEFAULT;
ALTER TABLE "UserSettings" ALTER COLUMN "theme" TYPE "Theme" USING ("theme"::text::"Theme");
ALTER TABLE "UserSettings" ALTER COLUMN "theme" SET DEFAULT 'system';

-- AlterTable UserSettings: Convert avatar column
ALTER TABLE "UserSettings" ALTER COLUMN "avatar" DROP DEFAULT;
ALTER TABLE "UserSettings" ALTER COLUMN "avatar" TYPE "AvatarMode" USING ("avatar"::text::"AvatarMode");
ALTER TABLE "UserSettings" ALTER COLUMN "avatar" SET DEFAULT 'default';

-- AlterTable Subscription: Convert tier column
ALTER TABLE "Subscription" ALTER COLUMN "tier" TYPE "SubscriptionTier" USING ("tier"::text::"SubscriptionTier");

-- AlterTable Subscription: Convert currency column
ALTER TABLE "Subscription" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "Subscription" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable UserDashboard: Convert role column
ALTER TABLE "UserDashboard" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "UserDashboard" ALTER COLUMN "role" TYPE "DashboardRole" USING ("role"::text::"DashboardRole");
ALTER TABLE "UserDashboard" ALTER COLUMN "role" SET DEFAULT 'viewer';

-- AlterTable User: Convert role column (nullable)
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
