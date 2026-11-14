-- MigrateData: replaces the boot-time legacy 2FA reset. A "totpSecret" is a next-auth-era TOTP
-- enrollment that better-auth cannot verify, so turn 2FA off for those accounts (they sign in with
-- their password and can enroll again) unless they already hold a better-auth "TwoFactor" row.
-- Runs once on every install, whatever version it upgrades from.
UPDATE "User" SET "twoFactorEnabled" = false
WHERE "totpSecret" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "TwoFactor" WHERE "TwoFactor"."userId" = "User"."id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "totpSecret";
