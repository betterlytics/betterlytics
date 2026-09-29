/**
 * The install snippet as it looks in each framework: the same script tag, or
 * the package where a framework prefers one. `file` is the path the tab bar
 * shows; the package tab spans two places, so it names the second in a comment.
 * Lines that begin with `+` are the ones the reader adds; the frame lights
 * those and dims the rest. `logo` names a file in public/framework-logos.
 * YOUR_SITE_ID is a deliberate placeholder.
 */
export type Snippet = { id: string; name: string; file?: string; logo?: string; bundled?: boolean; code: string };

const SRC = 'https://betterlytics.io/analytics.js';

export const SNIPPETS: readonly Snippet[] = [
  {
    id: 'html',
    name: 'HTML',
    file: 'index.html',
    logo: 'html',
    code: `<!doctype html>
<html lang="en">
  <head>
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
    file: 'app/layout.tsx',
    logo: 'nextjs-glyph',
    code: `+import Script from 'next/script'

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
    file: 'nuxt.config.ts',
    logo: 'nuxtjs',
    code: `export default defineNuxtConfig({
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
    file: 'src/app.html',
    logo: 'svelte',
    code: `<head>
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
    file: 'src/layouts/Layout.astro',
    logo: 'astro',
    code: `<head>
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
    code: `+npm install @betterlytics/tracker
# or: pnpm add · yarn add · bun add

// src/analytics.ts
+import betterlytics from '@betterlytics/tracker'
+
+betterlytics.init('YOUR_SITE_ID')`,
  },
];
