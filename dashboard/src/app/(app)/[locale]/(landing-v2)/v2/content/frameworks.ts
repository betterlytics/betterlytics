/**
 * Two rows of frameworks. `logo` names a file in public/framework-logos;
 * `dark` marks a mark drawn in black, which the strip inverts on canvas.
 */
export type Framework = { name: string; logo: string; dark?: boolean };

export const FRAMEWORK_ROWS: readonly (readonly Framework[])[] = [
  [
    { name: 'React', logo: 'react' },
    { name: 'Next.js', logo: 'nextjs', dark: true },
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
    { name: 'Squarespace', logo: 'squarespace', dark: true },
    { name: 'Wix', logo: 'wix' },
    { name: 'Gatsby', logo: 'gatsby' },
    { name: 'Laravel', logo: 'laravel' },
    { name: 'HTML', logo: 'html' },
    { name: 'Tag Manager', logo: 'gtm' },
  ],
];
