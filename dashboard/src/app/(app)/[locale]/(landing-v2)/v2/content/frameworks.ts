/**
 * Two rows of frameworks. `logo` names a file in public/framework-logos. Marks
 * that ship as a black disc (Next.js, Squarespace) use a glyph-only copy, so
 * every mark in the strip is a bare glyph.
 */
export type Framework = { name: string; logo: string };

export const FRAMEWORK_ROWS: readonly (readonly Framework[])[] = [
  [
    { name: 'React', logo: 'react' },
    { name: 'Next.js', logo: 'nextjs-glyph' },
    { name: 'Vue', logo: 'vue' },
    { name: 'Nuxt', logo: 'nuxtjs' },
    { name: 'Svelte', logo: 'svelte' },
    { name: 'Astro', logo: 'astro' },
    { name: 'Remix', logo: 'remix' },
    { name: 'Solid', logo: 'solidjs' },
    { name: 'Angular', logo: 'angular' },
  ],
  [
    { name: 'WordPress', logo: 'wordpress' },
    { name: 'Shopify', logo: 'shopify' },
    { name: 'Webflow', logo: 'webflow' },
    { name: 'Squarespace', logo: 'squarespace-glyph' },
    { name: 'Wix', logo: 'wix' },
    { name: 'Gatsby', logo: 'gatsby' },
    { name: 'Laravel', logo: 'laravel' },
    { name: 'HTML', logo: 'html' },
    { name: 'Tag Manager', logo: 'gtm' },
  ],
];
