import { createColorGetter } from './colorUtils';

// Colors for different referrer categories
export const REFERRER_COLORS: Record<string, string> = {
  'search': '#3B82F6', // Blue
  'social': '#8B5CF6', // Violet
  'direct': '#10B981', // Emerald
  'email': '#EF4444',  // Red
  'other': '#F59E0B',  // Amber
};

/**
 * Gets the color for a referrer type, defaulting to 'other' if not found
 */
export function getReferrerColor(referrerType: string): string {
  return createColorGetter({
    colorMap: REFERRER_COLORS,
    defaultColor: REFERRER_COLORS.other,
  })(referrerType);
} 