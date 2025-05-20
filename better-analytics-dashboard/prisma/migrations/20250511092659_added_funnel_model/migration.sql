/*
  Warnings:

  - A unique constraint covering the columns `[siteId]` on the table `Site` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Funnel" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Funnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_siteId_key" ON "Site"("siteId");

-- AddForeignKey
ALTER TABLE "Funnel" ADD CONSTRAINT "Funnel_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
