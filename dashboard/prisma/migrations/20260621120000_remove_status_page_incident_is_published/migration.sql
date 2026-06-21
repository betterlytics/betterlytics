-- Incidents on public status pages are always public now; retire the per-incident publish flag.
-- DropIndex
DROP INDEX "StatusPageIncident_statusPageId_isPublished_idx";

-- AlterTable
ALTER TABLE "StatusPageIncident" DROP COLUMN "isPublished";
