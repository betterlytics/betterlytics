export const browserIconNames = {
  chrome: 'logos:chrome',
  firefox: 'logos:firefox',
  safari: 'logos:safari',
  edge: 'logos:microsoft-edge',
  opera: 'logos:opera',
  brave: 'logos:brave',
  vivaldi: 'logos:vivaldi',
  arc: 'simple-icons:arc',
} as const;

export type BrowserType = keyof typeof browserIconNames;

export const browserLabels: Record<string, string> = {
  chrome: 'Google Chrome',
  firefox: 'Mozilla Firefox',
  safari: 'Safari',
  edge: 'Microsoft Edge',
  opera: 'Opera',
  brave: 'Brave',
  vivaldi: 'Vivaldi',
  arc: 'Arc',
};

// Map common alias keys to canonical browser keys for icon/label mapping.
// Keys are lowercase and stripped of non-alphanumeric characters.
const browserAliasToCanonical: Record<string, BrowserType> = {
  // Chrome family
  chromemobile: 'chrome',
  chromeios: 'chrome',
  crios: 'chrome',
  chromium: 'chrome',

  // Safari family
  mobilesafari: 'safari',
  safariios: 'safari',

  // Firefox family
  firefoxmobile: 'firefox',
  fxios: 'firefox',

  // Edge family
  microsoftedge: 'edge',
  edg: 'edge',

  // Opera family
  opr: 'opera',
  operamobile: 'opera',
  operagx: 'opera',
};

export const normalizeBrowserKey = (name: string): BrowserType | undefined => {
  const compact = name.toLowerCase().replace(/\s+/g, '');
  const canonical = (browserAliasToCanonical[compact] ?? compact) as string;
  return canonical in browserIconNames ? (canonical as BrowserType) : undefined;
};
