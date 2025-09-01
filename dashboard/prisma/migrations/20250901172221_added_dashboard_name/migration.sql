-- 1. Add the column as nullable first
ALTER TABLE "Dashboard" ADD COLUMN "name" TEXT;

-- 2. Populate it from the existing "domain"
UPDATE "Dashboard" SET "name" = "domain";

-- 3. Enforce non-null constraint on name
ALTER TABLE "Dashboard" ALTER COLUMN "name" SET NOT NULL;

-- 4. Remove non-null constraint on domain
ALTER TABLE "Dashboard" ALTER COLUMN "domain" DROP NOT NULL;
