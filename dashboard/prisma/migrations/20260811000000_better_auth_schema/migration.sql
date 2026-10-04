-- next-auth -> better-auth schema migration. Renames preserve data; the only
-- destructive steps are the Session wipe and dropping User.passwordHash after the
-- hashes are copied into credential Account rows.

-- Cookie name and token semantics change at cutover, so every session is a forced logout.
DELETE FROM "Session";
ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO "token";
ALTER TABLE "Session" RENAME COLUMN "expires" TO "expiresAt";
ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT;
ALTER INDEX "Session_sessionToken_key" RENAME TO "Session_token_key";
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Account" RENAME COLUMN "provider" TO "providerId";
ALTER TABLE "Account" RENAME COLUMN "providerAccountId" TO "accountId";
ALTER TABLE "Account" RENAME COLUMN "refresh_token" TO "refreshToken";
ALTER TABLE "Account" RENAME COLUMN "access_token" TO "accessToken";
ALTER TABLE "Account" RENAME COLUMN "id_token" TO "idToken";
ALTER TABLE "Account" ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3);
UPDATE "Account" SET "accessTokenExpiresAt" = to_timestamp("expires_at") WHERE "expires_at" IS NOT NULL;
ALTER TABLE "Account" DROP COLUMN "expires_at";
ALTER TABLE "Account" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN "password" TEXT;
ALTER TABLE "Account" DROP COLUMN "type";
ALTER TABLE "Account" DROP COLUMN "token_type";
ALTER TABLE "Account" DROP COLUMN "session_state";
ALTER INDEX "Account_provider_providerAccountId_key" RENAME TO "Account_providerId_accountId_key";
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- The hash moves off User onto a credential Account row; accountId = user id is
-- better-auth's convention there.
INSERT INTO "Account" ("id", "userId", "accountId", "providerId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "id", 'credential', "passwordHash", NOW(), NOW()
FROM "User"
WHERE "passwordHash" IS NOT NULL;

-- better-auth needs the boolean; the timestamps move aside so the audit trail survives.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
UPDATE "User" SET "emailVerifiedAt" = "emailVerified";

ALTER TABLE "User"
  ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL),
  ALTER COLUMN "emailVerified" SET DEFAULT false,
  ALTER COLUMN "emailVerified" SET NOT NULL;

-- better-auth lowercases the email on every lookup, so a mixed-case row could never
-- sign in again. Rows differing only in case abort the migration on the unique index;
-- resolve those duplicates manually before retrying.
UPDATE "User" SET "email" = LOWER("email") WHERE "email" <> LOWER("email");
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- Values survive the rename; the one-time boot task then disables legacy enrollments.
ALTER TABLE "User" RENAME COLUMN "totpEnabled" TO "twoFactorEnabled";
ALTER TABLE "User" DROP COLUMN "passwordHash";

-- better-auth's internal storage (OAuth state/PKCE).
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

CREATE TABLE "TwoFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TwoFactor_userId_idx" ON "TwoFactor"("userId");

-- Declared by the twoFactor plugin's schema
CREATE INDEX "TwoFactor_secret_idx" ON "TwoFactor"("secret");

ALTER TABLE "TwoFactor" ADD CONSTRAINT "TwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
