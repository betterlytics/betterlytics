'use client';

export function markerBgClassForLabel(label: string): string {
  switch (label) {
    case 'Mouse Interaction':
      return 'bg-sky-500 dark:bg-sky-400';
    case 'Selection':
      return 'bg-emerald-500 dark:bg-emerald-400';
    case 'DOM Mutation':
    case 'Full snapshot':
      return 'bg-green-500 dark:bg-green-400';
    case 'Scroll':
      return 'bg-amber-500 dark:bg-amber-400';
    case 'Navigation':
      return 'bg-primary';
    case 'Input':
      return 'bg-rose-500 dark:bg-rose-400';
    case 'Pageview':
      return 'bg-sky-500 dark:bg-sky-400';
    default:
      return 'bg-muted-foreground';
  }
}

const colorMap: Record<string, Record<string, string>> = {
  light: {
    primary: `oklch(62% 0.17 268.71)`,
    'Mouse Interaction': `#0ea5e9`,
    Selection: `#10b981`,
    'DOM Mutation': `#8b5cf6`,
    'Full snapshot': `#8b5cf6`,
    Scroll: `#f59e0b`,
    Navigation: `oklch(62% 0.17 268.71)`,
    Input: `#f43f5e`,
    Pageview: `#0ea5e9`,
    default: `oklch(0.5 0 0)`,
  },
  dark: {
    primary: `oklch(56% 0.196 268.74)`,
    'Mouse Interaction': `#38bdf8`,
    Selection: `#34d399`,
    'DOM Mutation': `#a78bfa`,
    'Full snapshot': `#05df72`,
    Scroll: `#fbbf24`,
    Navigation: `oklch(56% 0.196 268.74)`,
    Input: `#fb7185`,
    Pageview: `#38bdf8`,
    default: `oklch(0.86 0.02 265)`,
  },
};

export function markerFillColorForLabel(theme: string, label: string): string {
  const themeMap = colorMap[theme];
  const c = themeMap[label];
  if (c) return c;

  return themeMap.default;
}
