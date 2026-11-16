-- AlterTable
ALTER TABLE "HeatmapCaptureLink" ADD COLUMN     "capturePath" TEXT;
UPDATE "HeatmapCaptureLink" SET "capturePath" = "path";
ALTER TABLE "HeatmapCaptureLink" ALTER COLUMN "capturePath" SET NOT NULL;

-- AlterTable
ALTER TABLE "HeatmapCapture" ADD COLUMN     "capturedFromPath" TEXT;
UPDATE "HeatmapCapture" SET "capturedFromPath" = "path";
ALTER TABLE "HeatmapCapture" ALTER COLUMN "capturedFromPath" SET NOT NULL;
