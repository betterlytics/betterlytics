/*
  Warnings:

  - You are about to drop the column `pages` on the `Funnel` table. All the data in the column will be lost.
  - Added the required column `filter` to the `Funnel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Funnel" DROP COLUMN "pages",
ADD COLUMN     "filter" JSONB NOT NULL;
