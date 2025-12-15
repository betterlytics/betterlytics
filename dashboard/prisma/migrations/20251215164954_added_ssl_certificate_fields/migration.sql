-- AlterTable
ALTER TABLE "MonitorCheck" ADD COLUMN     "checkSslErrors" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sslExpiryReminders" BOOLEAN NOT NULL DEFAULT true;
