import { getColorForValue } from './colorUtils';

/**
 * Get a consistent color for a campaign source name.
 * Uses RGB format for better compatibility with existing charts.
 */
export function getCampaignSourceColor(sourceName: string): string {
  return getColorForValue(sourceName, {
    format: 'rgb',
  });
}
