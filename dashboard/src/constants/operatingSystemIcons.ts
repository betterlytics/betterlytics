export const osIconNamesThemed = {
  windows: {
    light: 'mdi:microsoft-windows',
    dark: 'mdi:microsoft-windows',
  },
  windows11: {
    light: 'mdi:microsoft-windows',
    dark: 'mdi:microsoft-windows',
  },
  windows10: {
    light: 'mdi:microsoft-windows',
    dark: 'mdi:microsoft-windows',
  },
  windows8: {
    light: 'mdi:microsoft-windows',
    dark: 'mdi:microsoft-windows',
  },
  windows7: {
    light: 'mdi:microsoft-windows',
    dark: 'mdi:microsoft-windows',
  },
  macos: {
    light: 'logos:apple',
    dark: 'simple-icons:apple',
  },
  ios: {
    light: 'logos:apple',
    dark: 'simple-icons:apple',
  },
  android: {
    light: 'logos:android-icon',
    dark: 'logos:android-icon',
  },
  linux: {
    light: 'logos:linux-tux',
    dark: 'simple-icons:linux',
  },
  ubuntu: {
    light: 'logos:ubuntu',
    dark: 'logos:ubuntu',
  },
} as const;

export type OSType = keyof typeof osIconNamesThemed;

export function resolveOSIcon(name: string) {
  return osIconNamesThemed[name.toLowerCase().replace(/\s+/g, '') as OSType] ?? null;
}

export const osLabels = {
  windows: 'Windows',
  windows11: 'Windows 11',
  windows10: 'Windows 10',
  windows8: 'Windows 8',
  windows7: 'Windows 7',
  macos: 'macOS',
  ios: 'iOS',
  android: 'Android',
  linux: 'Linux',
  ubuntu: 'Ubuntu',
} as const;
