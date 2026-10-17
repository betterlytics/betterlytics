-- CreateEnum
CREATE TYPE "SignupMethod" AS ENUM ('registration_enabled', 'invited', 'first_user');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signupMethod" "SignupMethod";
