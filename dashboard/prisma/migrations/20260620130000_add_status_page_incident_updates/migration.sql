-- CreateTable
CREATE TABLE "StatusPageIncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" "StatusPageIncidentStatus" NOT NULL,
    "message" TEXT,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusPageIncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusPageIncidentUpdate_incidentId_createdAt_idx" ON "StatusPageIncidentUpdate"("incidentId", "createdAt");

-- AddForeignKey
ALTER TABLE "StatusPageIncidentUpdate" ADD CONSTRAINT "StatusPageIncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "StatusPageIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: seed one timeline entry per existing incident from its current state so no incident
-- starts with an empty timeline. createdById carries the original author; the seed time mirrors the
-- incident's createdAt. gen_random_uuid() is core Postgres (>= 13), no extension required.
INSERT INTO "StatusPageIncidentUpdate" ("id", "incidentId", "status", "message", "changedFields", "createdById", "createdAt")
SELECT gen_random_uuid()::text, "id", "status", "body", ARRAY[]::TEXT[], "createdById", "createdAt"
FROM "StatusPageIncident";
