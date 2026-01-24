-- CreateEnum
CREATE TYPE "OnboardingGoalStatus" AS ENUM ('pending', 'completed', 'skipped');

-- CreateTable
CREATE TABLE "DashboardOnboardingGoal" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "status" "OnboardingGoalStatus" NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardOnboardingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardOnboardingGoal_dashboardId_idx" ON "DashboardOnboardingGoal"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardOnboardingGoal_dashboardId_goalId_key" ON "DashboardOnboardingGoal"("dashboardId", "goalId");

-- AddForeignKey
ALTER TABLE "DashboardOnboardingGoal" ADD CONSTRAINT "DashboardOnboardingGoal_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
