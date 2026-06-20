-- Status page: owner toggle to hide the "Powered by Betterlytics" footer.
-- Gated server-side to the plan's removeBranding capability; the public render also re-checks the
-- owner's current entitlement, so a downgrade restores the badge regardless of this stored flag.
ALTER TABLE "StatusPage" ADD COLUMN "hideBranding" BOOLEAN NOT NULL DEFAULT false;
