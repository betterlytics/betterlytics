/**
 * The install snippet as it looks in each framework: the same script tag, or
 * the package where a framework prefers one. Each opens with a comment naming
 * the file it goes in. Lines that begin with `+` are the ones the reader adds;
 * the frame lights those and dims the rest. `logo` names a file in
 * public/framework-logos. YOUR_SITE_ID is a deliberate placeholder.
 */
export type Snippet = { id: string; name: string; logo?: string; bundled?: boolean; code: string };

const SRC = 'https://betterlytics.io/analytics.js';

export const SNIPPETS: readonly Snippet[] = [
  {
    id: 'html',
    name: 'HTML',
    logo: 'html',
    code: `<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Acme</title>
+    <script async
+      src="${SRC}"
+      data-site-id="YOUR_SITE_ID">
+    </script>
  </head>
  <body>
    …
  </body>
</html>`,
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    logo: 'nextjs',
    code: `// app/layout.tsx
+import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
+        <Script
+          src="${SRC}"
+          data-site-id="YOUR_SITE_ID"
+        />
      </body>
    </html>
  )
}`,
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    logo: 'nuxtjs',
    code: `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
+      script: [{
+        src: '${SRC}',
+        async: true,
+        'data-site-id': 'YOUR_SITE_ID',
+      }],
    },
  },
})`,
  },
  {
    id: 'svelte',
    name: 'SvelteKit',
    logo: 'svelte',
    code: `<!-- src/app.html -->
<head>
  %sveltekit.head%
+  <script async
+    src="${SRC}"
+    data-site-id="YOUR_SITE_ID">
+  </script>
</head>`,
  },
  {
    id: 'astro',
    name: 'Astro',
    logo: 'astro',
    code: `<!-- src/layouts/Layout.astro -->
<head>
+  <script is:inline async
+    src="${SRC}"
+    data-site-id="YOUR_SITE_ID">
+  </script>
</head>`,
  },
  {
    id: 'package',
    name: 'Package',
    bundled: true,
    code: `# terminal
+npm install @betterlytics/tracker
# or: pnpm add · yarn add · bun add

// src/analytics.ts
+import betterlytics from '@betterlytics/tracker'
+
+betterlytics.init('YOUR_SITE_ID')`,
  },
];
