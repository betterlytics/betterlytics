'use server';

import { checkAuth } from "@/lib/auth-actions";
import { getUserJourneyForSankeyDiagram } from "@/services/userJourney";
import { SankeyData } from "@/entities/userJourney";

/**
 * Fetch user journey data for Sankey diagram visualization
 * 
 * This returns complete user journeys grouped by frequency,
 * showing the exact paths users take through a site.
 * maxSteps is the number of steps in the journey (e.g., maxSteps=3 shows A→B→C)
 */
export async function fetchUserJourneyAction(
  siteId: string, 
  startDate: Date, 
  endDate: Date, 
  maxSteps: number = 3,
  limit: number = 50
): Promise<SankeyData> {
  await checkAuth();
  return getUserJourneyForSankeyDiagram(siteId, startDate, endDate, maxSteps, limit);
}
