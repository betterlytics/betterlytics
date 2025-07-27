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
  if (!deviceType) return '#94A3B8'; // Gray for unknown

  const displayLabel = getDeviceLabel(deviceType).toLowerCase();

  // Generate a unique color based on the display label
  const hash = hashString(displayLabel);
  return generateColorFromHash(hash);
}
