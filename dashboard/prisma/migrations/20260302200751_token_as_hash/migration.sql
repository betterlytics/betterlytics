/*
  Warnings:

  - You are about to drop the column `token` on the `McpToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `McpToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prefix` to the `McpToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `McpToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "McpToken_token_idx";

-- DropIndex
DROP INDEX "McpToken_token_key";

-- AlterTable
ALTER TABLE "McpToken" DROP COLUMN "token",
ADD COLUMN     "prefix" TEXT NOT NULL,
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "McpToken_tokenHash_key" ON "McpToken"("tokenHash");

-- CreateIndex
CREATE INDEX "McpToken_tokenHash_idx" ON "McpToken"("tokenHash");
