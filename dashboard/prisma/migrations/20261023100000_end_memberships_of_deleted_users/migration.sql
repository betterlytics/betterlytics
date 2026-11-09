-- Accounts deleted before memberships were soft-deleted kept their live memberships, so they still
-- showed in member lists and counts. End them at the account's deletion time; the remover is unknown.
UPDATE "UserDashboard" ud
SET "deletedAt" = u."deletedAt"
FROM "User" u
WHERE ud."userId" = u.id
  AND u."deletedAt" IS NOT NULL
  AND ud."deletedAt" IS NULL;
