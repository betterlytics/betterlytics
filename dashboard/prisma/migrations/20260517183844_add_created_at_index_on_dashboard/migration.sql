-- CreateIndex
CREATE INDEX "Dashboard_createdAt_idx" ON "Dashboard"("createdAt");

-- Backfill: prefix existing usage-alert SentEmail recipientKeys so they align with createUserRecipientKey('user:<id>')
UPDATE "SentEmail"
SET "recipientKey" = 'user:' || "recipientKey"
WHERE "campaignKey" LIKE 'usage-alert:%'
  AND "recipientKey" NOT LIKE 'user:%';
