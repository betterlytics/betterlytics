-- DropIndex
DROP INDEX IF EXISTS "Session_accessToken_key";

-- AlterTable: Remove accessToken column from Session
ALTER TABLE "Session" DROP COLUMN IF EXISTS "accessToken";

-- Update foreign key constraint to cascade on delete
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
