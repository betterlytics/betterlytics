-- MigrateData: "User"."role" now marks the instance admin. Historically every email/password
-- sign-up was defaulted to 'admin' (OAuth sign-ups were not), so the existing values carry no
-- meaning. Clear them, then promote the earliest live account: on seeded self-host installs
-- that is the boot-time admin by construction. From here on only the first sign-up sets it.
UPDATE "User" SET "role" = NULL;

UPDATE "User" SET "role" = 'admin'
WHERE "id" = (
  SELECT "id" FROM "User"
  WHERE "deletedAt" IS NULL
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
);
