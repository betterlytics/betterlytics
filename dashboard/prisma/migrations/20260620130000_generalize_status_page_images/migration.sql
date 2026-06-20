-- DropTable
DROP TABLE "StatusPageLogo";

-- AlterTable
ALTER TABLE "StatusPage" ADD COLUMN "faviconHash" TEXT;

-- CreateTable
CREATE TABLE "StatusPageImage" (
    "statusPageId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageImage_pkey" PRIMARY KEY ("statusPageId", "kind")
);

-- AddForeignKey
ALTER TABLE "StatusPageImage" ADD CONSTRAINT "StatusPageImage_statusPageId_fkey" FOREIGN KEY ("statusPageId") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
