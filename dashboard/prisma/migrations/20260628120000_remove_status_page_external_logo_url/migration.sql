-- Remove the unused external-URL logo escape hatch. Logos are always uploaded and served from our
-- own image route (via logoHash), so this column was never populated by the app.
ALTER TABLE "StatusPage" DROP COLUMN "logoUrl";
