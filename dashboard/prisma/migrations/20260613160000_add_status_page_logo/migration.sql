-- AlterTable
ALTER TABLE "StatusPage" ADD COLUMN "logoHash" TEXT;

-- CreateTable
CREATE TABLE "StatusPageLogo" (
    "statusPageId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageLogo_pkey" PRIMARY KEY ("statusPageId")
);

-- AddForeignKey
ALTER TABLE "StatusPageLogo" ADD CONSTRAINT "StatusPageLogo_statusPageId_fkey" FOREIGN KEY ("statusPageId") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
