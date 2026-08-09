export type IconAsset = {
  file: string;
  source?: string;
  mono?: true;
};

type BrowserDef = IconAsset & {
  label: string;
  match: RegExp[];
};

export const BROWSERS: Record<string, BrowserDef> = {
  chrome: {
    label: 'Google Chrome',
    file: 'chrome.svg',
    source: 'logos/chrome',
    match: [/chromium|crios|crmo|webview|cwv/, /\bchrome\b/],
  },
  firefox: {
    label: 'Mozilla Firefox',
    file: 'firefox.svg',
    source: 'logos/firefox',
    match: [/firefox|fxios/],
  },
  safari: {
    label: 'Safari',
    file: 'safari.svg',
    source: 'logos/safari',
    match: [/mobile\s+safari|\bsafari\b/],
  },
  edge: {
    label: 'Microsoft Edge',
    file: 'edge.svg',
    source: 'logos/microsoft-edge',
    match: [/edge|edgios|edga|\bedg\b/],
  },
  opera: {
    label: 'Opera',
    file: 'opera.svg',
    source: 'logos/opera',
    match: [/opera|\bopr\b/],
  },
  brave: {
    label: 'Brave',
    file: 'brave.svg',
    source: 'logos/brave',
    match: [/brave/],
  },
  vivaldi: {
    label: 'Vivaldi',
    file: 'vivaldi.svg',
    source: 'logos/vivaldi',
    match: [/vivaldi/],
  },
  duckduckgo: {
    label: 'DuckDuckGo',
    file: 'duckduckgo.svg',
    source: 'logos/duckduckgo',
    match: [/duckduckgo/],
  },
  electron: {
    label: 'Electron',
    file: 'electron.svg',
    source: 'logos/electron',
    match: [/electron/],
  },
  samsunginternet: {
    label: 'Samsung Internet',
    file: 'samsunginternet.svg',
    match: [/samsung\s*internet/],
  },
  yandexbrowser: {
    label: 'Yandex Browser',
    file: 'yandexbrowser.svg',
    match: [/yandex/],
  },
  ucbrowser: {
    label: 'UC Browser',
    file: 'ucbrowser.svg',
    match: [/uc[-_\s]?browser|uc[-_\s]?crawl|^uc\b/],
  },
  ecosia: {
    label: 'Ecosia',
    file: 'ecosia.svg',
    match: [/ecosia/],
  },
  google: {
    label: 'Google',
    file: 'google.svg',
    source: 'logos/google-icon',
    match: [/google\s+search/, /google/],
  },
  twitter: {
    label: 'Twitter',
    file: 'twitter.svg',
    source: 'logos/twitter',
    match: [/twitter/],
  },
  facebook: {
    label: 'Facebook',
    file: 'facebook.svg',
    source: 'logos/facebook',
    match: [/\bfbios\b/, /facebook/],
  },
  appleMail: {
    label: 'Apple Mail',
    file: 'apple-mail.svg',
    match: [/apple\s+mail/],
  },
} as const;

export function resolveBrowser(input: string) {
  const name = input.trim().toLowerCase();

  for (const def of Object.values(BROWSERS)) {
    if (def.match.some((r) => r.test(name))) {
      return def;
    }
  }

  return null;
}
