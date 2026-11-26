-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "discountEndsAt" TIMESTAMP(3),
ADD COLUMN     "discountPercentOff" DOUBLE PRECISION;
