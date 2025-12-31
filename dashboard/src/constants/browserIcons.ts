type BrowserBase = {
  label: string;
  match: RegExp[];
};

type BrowserWithIcon = BrowserBase & {
  icon: string;
  localFile?: never;
};

type BrowserWithLocalFile = BrowserBase & {
  localFile: string;
  icon?: never;
};

type BrowserDef = BrowserWithIcon | BrowserWithLocalFile;

export const BROWSERS: Record<string, BrowserDef> = {
  chrome: {
    label: 'Google Chrome',
    icon: 'logos:chrome',
    match: [/chromium|crios|crmo|webview|cwv/, /\bchrome\b/],
  },
  firefox: {
    label: 'Mozilla Firefox',
    icon: 'logos:firefox',
    match: [/firefox|fxios/],
  },
  safari: {
    label: 'Safari',
    icon: 'logos:safari',
    match: [/mobile\s+safari|\bsafari\b/],
  },
  edge: {
    label: 'Microsoft Edge',
    icon: 'logos:microsoft-edge',
    match: [/edge|edgios|edga|\bedg\b/],
  },
  opera: {
    label: 'Opera',
    icon: 'logos:opera',
    match: [/opera|\bopr\b/],
  },
  brave: {
    label: 'Brave',
    icon: 'logos:brave',
    match: [/brave/],
  },
  vivaldi: {
    label: 'Vivaldi',
    icon: 'logos:vivaldi',
    match: [/vivaldi/],
  },
  arc: {
    label: 'Arc',
    icon: 'simple-icons:arc',
    match: [/\barc\b/],
  },
  duckduckgo: {
    label: 'DuckDuckGo',
    icon: 'logos:duckduckgo',
    match: [/duckduckgo/],
  },
  electron: {
    label: 'Electron',
    icon: 'logos:electron',
    match: [/electron/],
  },
  samsunginternet: {
    label: 'Samsung Internet',
    localFile: 'samsunginternet.svg',
    match: [/samsung\s*internet/],
  },
  yandexbrowser: {
    label: 'Yandex Browser',
    localFile: 'yandexbrowser.svg',
    match: [/yandex/],
  },
  ucbrowser: {
    label: 'UC Browser',
    localFile: 'ucbrowser.svg',
    match: [/uc[-_\s]?browser|uc[-_\s]?crawl|^uc\b/],
  },
  ecosia: {
    label: 'Ecosia',
    localFile: 'ecosia.svg',
    match: [/ecosia/],
  },
  google: {
    label: 'Google',
    localFile: 'google.svg',
    match: [/google\s+search/, /google/],
  },
  twitter: {
    label: 'Twitter',
    localFile: 'twitter.svg',
    match: [/twitter/],
  },
  facebook: {
    label: 'Facebook',
    localFile: 'facebook.svg',
    match: [/\bfbios\b/, /facebook/],
  },
  appleMail: {
    label: 'Apple Mail',
    localFile: 'apple-mail.svg',
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
