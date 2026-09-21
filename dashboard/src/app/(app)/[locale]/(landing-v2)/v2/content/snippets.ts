/**
 * The install snippet as it looks in each framework: the same script tag, or
 * the package where a framework prefers one. `logo` names a file in
 * public/framework-logos. YOUR_SITE_ID is a deliberate placeholder.
 */
export type Snippet = { id: string; tab: string; logo?: string; code: string };

const SRC = 'https://betterlytics.io/analytics.js';

export const SNIPPETS: readonly Snippet[] = [
  {
    id: 'html',
    tab: 'index.html',
    logo: 'html',
    code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Acme</title>
    <script async
      src="${SRC}"
      data-site-id="YOUR_SITE_ID">
    </script>
  </head>
  <body>
    …
  </body>
</html>`,
  },
  {
    id: 'nextjs',
    tab: 'layout.tsx',
    logo: 'nextjs',
    code: `import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${SRC}"
          data-site-id="YOUR_SITE_ID"
        />
      </body>
    </html>
  )
}`,
  },
  {
    id: 'nuxt',
    tab: 'nuxt.config.ts',
    logo: 'nuxtjs',
    code: `export default defineNuxtConfig({
  app: {
    head: {
      script: [{
        src: '${SRC}',
        async: true,
        'data-site-id': 'YOUR_SITE_ID',
      }],
    },
  },
})`,
  },
  {
    id: 'svelte',
    tab: 'app.html',
    logo: 'svelte',
    code: `<head>
  %sveltekit.head%
  <script async
    src="${SRC}"
    data-site-id="YOUR_SITE_ID">
  </script>
</head>`,
  },
  {
    id: 'astro',
    tab: 'Layout.astro',
    logo: 'astro',
    code: `<head>
  <script is:inline async
    src="${SRC}"
    data-site-id="YOUR_SITE_ID">
  </script>
</head>`,
  },
  {
    id: 'npm',
    tab: 'npm',
    code: `npm install @betterlytics/tracker

import betterlytics from '@betterlytics/tracker'

betterlytics.init('YOUR_SITE_ID')`,
  },
];
