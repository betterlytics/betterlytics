-- CreateTable
CREATE TABLE "AnalyticsSalt" (
    "saltDate" DATE NOT NULL,
    "salt" BYTEA NOT NULL,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSalt_pkey" PRIMARY KEY ("saltDate")
);
