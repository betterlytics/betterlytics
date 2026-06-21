-- Move to a pure public update timeline: every update carries a message, no per-field audit.

-- Drop contentless audit entries (field-edits with no message) left by the previous model.
DELETE FROM "StatusPageIncidentUpdate" WHERE "message" IS NULL;

-- Body is now a denormalized mirror of the latest update's message. Sync existing rows so it matches
-- the most recent remaining update before the column stops being directly edited.
UPDATE "StatusPageIncident" i
SET "body" = u."message"
FROM (
  SELECT DISTINCT ON ("incidentId") "incidentId", "message"
  FROM "StatusPageIncidentUpdate"
  ORDER BY "incidentId", "createdAt" DESC
) u
WHERE u."incidentId" = i."id";

-- Drop the audit column and require a message on every update.
ALTER TABLE "StatusPageIncidentUpdate" DROP COLUMN "changedFields";
ALTER TABLE "StatusPageIncidentUpdate" ALTER COLUMN "message" SET NOT NULL;
