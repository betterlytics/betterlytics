/** Two marquee rows. `logo` names a file in public/framework-logos. */
export type Framework = { name: string; logo: string };

export const FRAMEWORK_ROWS: readonly (readonly Framework[])[] = [
  [
    { name: 'React', logo: 'react' },
    { name: 'Next.js', logo: 'nextjs' },
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
    { name: 'Squarespace', logo: 'squarespace' },
    { name: 'Wix', logo: 'wix' },
    { name: 'Gatsby', logo: 'gatsby' },
    { name: 'Laravel', logo: 'laravel' },
    { name: 'HTML', logo: 'html' },
    { name: 'Tag Manager', logo: 'gtm' },
  ],
];
