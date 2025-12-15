-- AlterTable
ALTER TABLE "MonitorCheck" ADD COLUMN     "acceptedStatusCodes" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
