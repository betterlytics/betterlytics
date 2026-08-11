-- next-auth -> better-auth schema migration.
-- Renames preserve data; the only destructive step is the Session wipe (forced
-- logout at cutover, announced) and dropping User.passwordHash after the hashes
-- are copied into credential Account rows.

-- Sessions: cookie name and token semantics change at cutover; drop all rows.
DELETE FROM "Session";
ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO "token";
ALTER TABLE "Session" RENAME COLUMN "expires" TO "expiresAt";
ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT;
ALTER INDEX "Session_sessionToken_key" RENAME TO "Session_token_key";

-- Accounts: rename to better-auth's field names.
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

-- Every password user gets a credential account row (the hash moves off User).
-- accountId = user id is better-auth's convention for credential accounts.
INSERT INTO "Account" ("id", "userId", "accountId", "providerId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "id", 'credential', "passwordHash", NOW(), NOW()
FROM "User"
WHERE "passwordHash" IS NOT NULL;

-- emailVerified: verified-at timestamp -> boolean.
ALTER TABLE "User"
  ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL),
  ALTER COLUMN "emailVerified" SET DEFAULT false,
  ALTER COLUMN "emailVerified" SET NOT NULL;

-- twoFactorEnabled keeps its values through the rename; the one-time boot task
-- disables legacy enrollments (plugin-incompatible secrets) and notifies users.
ALTER TABLE "User" RENAME COLUMN "totpEnabled" TO "twoFactorEnabled";
ALTER TABLE "User" DROP COLUMN "passwordHash";

-- better-auth's internal verification storage (OAuth state/PKCE).
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

-- twoFactor plugin storage.
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

ALTER TABLE "TwoFactor" ADD CONSTRAINT "TwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
