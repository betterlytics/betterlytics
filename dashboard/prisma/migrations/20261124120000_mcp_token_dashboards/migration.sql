-- CreateTable
CREATE TABLE "McpTokenDashboard" (
    "tokenId" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,

    CONSTRAINT "McpTokenDashboard_pkey" PRIMARY KEY ("tokenId","dashboardId")
);

-- Each existing token keeps covering only its dashboard. Token strings and hashes don't change.
INSERT INTO "McpTokenDashboard" ("tokenId", "dashboardId")
SELECT "id", "dashboardId" FROM "McpToken";

-- DropForeignKey
ALTER TABLE "McpToken" DROP CONSTRAINT "McpToken_dashboardId_fkey";

-- DropIndex
DROP INDEX "McpToken_dashboardId_idx";

-- AlterTable
ALTER TABLE "McpToken" DROP COLUMN "dashboardId";

-- CreateIndex
CREATE INDEX "McpToken_createdBy_idx" ON "McpToken"("createdBy");

-- CreateIndex
CREATE INDEX "McpTokenDashboard_dashboardId_idx" ON "McpTokenDashboard"("dashboardId");

-- AddForeignKey
ALTER TABLE "McpTokenDashboard" ADD CONSTRAINT "McpTokenDashboard_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "McpToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpTokenDashboard" ADD CONSTRAINT "McpTokenDashboard_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
