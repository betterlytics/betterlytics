-- CreateEnum
CREATE TYPE "GithubStarPromptState" AS ENUM ('pending', 'dismissed', 'starred');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubStarPromptState" "GithubStarPromptState" NOT NULL DEFAULT 'pending';
