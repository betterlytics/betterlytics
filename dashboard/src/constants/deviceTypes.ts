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
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a HSL color from a hash value
 * This creates visually distinct colors that are consistent for the same input
 */
function generateColorFromHash(hash: number): string {
  // Use the hash to determine hue (0-360)
  // Using golden ratio conjugate to get a good distribution
  const hue = (hash * 137.508) % 360;

  const saturation = 65 + (hash % 20);
  const lightness = 45 + (hash % 15);

  return `hsl(${Math.floor(hue)}, ${saturation}%, ${lightness}%)`;
}

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
  deviceType = deviceType.toLowerCase();

  if (!DEVICE_TYPES.includes(deviceType as (typeof DEVICE_TYPES)[number])) return DEVICE_COLOR_MAP.unknown;

  if (DEVICE_COLOR_MAP[deviceType]) return DEVICE_COLOR_MAP[deviceType];

  const hash = hashString(deviceType);
  return generateColorFromHash(hash);
}
