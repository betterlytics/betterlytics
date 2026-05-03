-- CreateTable
CREATE TABLE "SentEmail" (
    "id" TEXT NOT NULL,
    "recipientKey" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentEmail_recipientKey_campaignKey_key" ON "SentEmail"("recipientKey", "campaignKey");

-- CreateIndex
CREATE INDEX "SentEmail_recipientKey_idx" ON "SentEmail"("recipientKey");
