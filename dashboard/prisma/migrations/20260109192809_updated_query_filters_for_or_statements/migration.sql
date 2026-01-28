-- AlterTable
ALTER TABLE "FunnelStep"
ADD COLUMN "values" TEXT[];

UPDATE "FunnelStep"
SET "values" = ARRAY["value"];

ALTER TABLE "FunnelStep"
DROP COLUMN "value";

-- AlterTable
ALTER TABLE "SavedFilterEntry"
ADD COLUMN "values" TEXT[];

UPDATE "SavedFilterEntry"
SET "values" = ARRAY["value"];

ALTER TABLE "SavedFilterEntry"
DROP COLUMN "value";

