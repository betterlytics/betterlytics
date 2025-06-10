/*
  Warnings:

  - Changed the type of `pages` on the `Funnel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Funnel" DROP COLUMN "pages",
ADD COLUMN     "pages" JSONB NOT NULL;
