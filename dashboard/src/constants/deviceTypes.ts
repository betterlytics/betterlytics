import { createColorGetter, hashString as hashStringUtil } from '@/utils/colorUtils';

const DEVICE_TYPES = ['mobile', 'tablet', 'laptop', 'desktop', 'unknown'] as const;

const DEVICE_COLOR_MAP: Record<string, string> = {
  mobile: '#22c55e', // green-500
  tablet: '#f59e0b', // amber-500
  laptop: '#8b5cf6', // violet-500
  desktop: '#3b82f6', // blue-500
  unknown: '#9ca3af', // gray-400
};

/**
 * Generate a consistent hash code from a string
 * This is used to get a consistent color for a device type across users
 * Perhaps we should instead use a consistent color for different device types
 * 
 * @deprecated Use hashString from '@/utils/colorUtils' instead
 * Re-exported here for backward compatibility
 */
export const hashString = hashStringUtil;

/**
 * Format a device type string for display
 * Capitalizes first letter of each word and handles special cases
 */
export function getDeviceLabel(deviceType: string): string {
  if (!deviceType) return 'Unknown';

  const lowerType = deviceType.toLowerCase();

  // Otherwise, capitalize each word
  return lowerType
    .split(/[_\s-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get a consistent color for a device type
 * - Uses predefined colors for common device types
 * - Generates unique colors for other types using hashing
 */
export function getDeviceColor(deviceType: string): string {
  const getColor = createColorGetter({
    colorMap: DEVICE_COLOR_MAP,
    defaultColor: DEVICE_COLOR_MAP.unknown,
    saturation: 65,
    lightness: 45,
    useGoldenRatio: true,
  });

  // Check if device type is in the known types list
  const normalizedType = deviceType.toLowerCase();
  if (!DEVICE_TYPES.includes(normalizedType as (typeof DEVICE_TYPES)[number])) {
    return DEVICE_COLOR_MAP.unknown;
  }

  return getColor(deviceType);
}
