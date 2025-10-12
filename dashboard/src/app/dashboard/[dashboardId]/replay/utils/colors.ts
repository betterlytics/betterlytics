'use client';

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
    'Viewport Resize': `#6366f1`,
    'Media Interaction': `#f97316`,
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
    'Viewport Resize': `#818cf8`,
    'Media Interaction': `#fb923c`,
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
