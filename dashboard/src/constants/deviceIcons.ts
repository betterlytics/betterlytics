import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';

export const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
} as const;

export type DeviceType = keyof typeof deviceIcons;

export function resolveDeviceIcon(type: string) {
  return deviceIcons[type.toLowerCase() as DeviceType] ?? null;
}

export const deviceLabels = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  laptop: 'Laptop',
} as const;
