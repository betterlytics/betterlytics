const DEVICE_COLORS: Record<string, string> = {
  pc: '#3b82f6', // blue-500
  unknown: '#9ca3af', // gray-400
};

export function getDeviceColor(deviceType: string): string {
  const lowerDeviceType = deviceType.toLowerCase();
  if (DEVICE_COLORS[lowerDeviceType]) {
    return DEVICE_COLORS[lowerDeviceType];
  }
  return DEVICE_COLORS.unknown;
}