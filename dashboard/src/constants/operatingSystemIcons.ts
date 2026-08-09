import type { IconAsset } from './browserIcons';

export type OSDef = {
  label: string;
  icon: IconAsset;
  iconDark?: IconAsset;
};

const WINDOWS_ICON: IconAsset = { file: 'windows.svg', source: 'mdi/microsoft-windows', mono: true };
const APPLE_ICON: IconAsset = { file: 'apple.svg', source: 'logos/apple' };
const APPLE_ICON_DARK: IconAsset = { file: 'apple-dark.svg', source: 'simple-icons/apple', mono: true };

export const OS_ICONS = {
  windows: { label: 'Windows', icon: WINDOWS_ICON },
  windows11: { label: 'Windows 11', icon: WINDOWS_ICON },
  windows10: { label: 'Windows 10', icon: WINDOWS_ICON },
  windows8: { label: 'Windows 8', icon: WINDOWS_ICON },
  windows7: { label: 'Windows 7', icon: WINDOWS_ICON },
  macos: { label: 'macOS', icon: APPLE_ICON, iconDark: APPLE_ICON_DARK },
  ios: { label: 'iOS', icon: APPLE_ICON, iconDark: APPLE_ICON_DARK },
  android: { label: 'Android', icon: { file: 'android.svg', source: 'logos/android-icon' } },
  linux: {
    label: 'Linux',
    icon: { file: 'linux.svg', source: 'logos/linux-tux' },
    iconDark: { file: 'linux-dark.svg', source: 'simple-icons/linux', mono: true },
  },
  ubuntu: { label: 'Ubuntu', icon: { file: 'ubuntu.svg', source: 'logos/ubuntu' } },
} satisfies Record<string, OSDef>;

export type OSType = keyof typeof OS_ICONS;

export function resolveOSIcon(name: string): OSDef | null {
  return OS_ICONS[name.toLowerCase().replace(/\s+/g, '') as OSType] ?? null;
}
