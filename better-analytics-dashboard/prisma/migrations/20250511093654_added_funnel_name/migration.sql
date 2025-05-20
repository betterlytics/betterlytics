/*
  Warnings:

  - Added the required column `name` to the `Funnel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Funnel" ADD COLUMN     "name" TEXT NOT NULL;
