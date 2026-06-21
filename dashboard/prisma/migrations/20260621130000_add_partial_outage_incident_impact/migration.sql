-- Add a third incident severity between "Degraded" and "Major Outage", matching the standard
-- Degraded / Partial Outage / Major Outage scale used by Statuspage, Instatus and Cachet.
-- (No existing rows use it; the value 'outage' is now surfaced in the UI as "Major Outage".)
ALTER TYPE "StatusPageIncidentImpact" ADD VALUE 'partial_outage' BEFORE 'outage';
