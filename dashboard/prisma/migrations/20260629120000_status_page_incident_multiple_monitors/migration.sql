-- An incident can now affect multiple monitors, not just one. Replace the single nullable
-- monitorCheckId with a string array (empty = page-wide), preserving existing links by wrapping
-- each non-null id in a one-element array. No FK — these stay display-only references.
ALTER TABLE "StatusPageIncident" ADD COLUMN "monitorCheckIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "StatusPageIncident"
SET "monitorCheckIds" = ARRAY["monitorCheckId"]
WHERE "monitorCheckId" IS NOT NULL;

ALTER TABLE "StatusPageIncident" DROP COLUMN "monitorCheckId";
