-- Status pages always render in English now; the per-page language option has been removed.
ALTER TABLE "StatusPage" DROP COLUMN "language";
