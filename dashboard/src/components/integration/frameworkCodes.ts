import { FrameworkId } from './FrameworkGrid';

interface FrameworkCodeConfig {
  siteId: string;
  analyticsUrl: string;
  serverUrl?: string;
  isCloud: boolean;
}

// Each step can have a title, description, and optional code block
export interface FrameworkStep {
  title: string;
  description?: string;
  code?: string;
  language?: 'html' | 'javascript';
}

export interface FrameworkCode {
  steps: FrameworkStep[];
  note?: string;
}

export function getFrameworkCode(frameworkId: FrameworkId, config: FrameworkCodeConfig): FrameworkCode {
  const { siteId, analyticsUrl, serverUrl, isCloud } = config;
  const serverUrlAttr = !isCloud && serverUrl ? `\n    data-server-url="${serverUrl}"` : '';
  const serverUrlJS = !isCloud && serverUrl ? `\n    script.setAttribute('data-server-url', "${serverUrl}");` : '';

  const trackingScript = `<script async
    src="${analyticsUrl}/analytics.js"
    data-site-id="${siteId}"${serverUrlAttr}>
</script>`;

  switch (frameworkId) {
    case 'html':
      return {
        steps: [
          {
            title: 'Add the tracking script',
            description: 'Paste this inside your `<head>` tag',
            code: `<head>
  ${trackingScript}
</head>`,
            language: 'html',
          },
        ],
      };

    case 'nextjs':
      return {
        steps: [
          {
            title: 'Add to your root layout',
            description: 'Open `app/layout.tsx` and add the Script component inside `<head>`',
            code: `import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          async
          src="${analyticsUrl}/analytics.js"
          data-site-id="${siteId}"${
            serverUrlAttr
              ? `
          data-server-url="${serverUrl}"`
              : ''
          }
        />
      </head>
    </html>
  )
}`,
            language: 'javascript',
          },
        ],
      };

    case 'react':
      return {
        steps: [
          {
            title: 'Add to your App component',
            description: 'Add this to your root component (e.g., `App.tsx` or `main.tsx`)',
            code: `import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const script = document.createElement('script')
    script.async = true
    script.src = "${analyticsUrl}/analytics.js"
    script.setAttribute('data-site-id', "${siteId}")${serverUrlJS}
    document.head.appendChild(script)
  }, [])

  return (
    // Your app content
  )
}

export default App`,
            language: 'javascript',
          },
        ],
      };

    case 'vue':
      return {
        steps: [
          {
            title: 'Add to your main.ts',
            description: 'Add the tracking script before mounting your app',
            code: `import { createApp } from 'vue'
import App from './App.vue'

// Add tracking script
const script = document.createElement('script')
script.async = true
script.src = "${analyticsUrl}/analytics.js"
script.setAttribute('data-site-id', "${siteId}")${serverUrlJS.replace('    ', '')}
document.head.appendChild(script)

createApp(App).mount('#app')`,
            language: 'javascript',
          },
        ],
      };

    case 'nuxt':
      return {
        steps: [
          {
            title: 'Add to nuxt.config.ts',
            description: 'Add the script to your Nuxt config',
            code: `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [{
        src: '${analyticsUrl}/analytics.js',
        async: true,
        'data-site-id': '${siteId}'${!isCloud && serverUrl ? `,\n        'data-server-url': '${serverUrl}'` : ''}
      }]
    }
  }
})`,
            language: 'javascript',
          },
        ],
      };

    case 'svelte':
      return {
        steps: [
          {
            title: 'Add to app.html',
            description: 'Open `src/app.html` and paste this inside the `<head>` section',
            code: `<head>
  ${trackingScript}
  %sveltekit.head%
</head>`,
            language: 'html',
          },
        ],
      };

    case 'astro':
      return {
        steps: [
          {
            title: 'Add to your base layout',
            description: 'Open your layout file (e.g., `src/layouts/Layout.astro`)',
            code: `---
// Layout.astro
---
<head>
  ${trackingScript}
</head>`,
            language: 'html',
          },
        ],
      };

    case 'remix':
      return {
        steps: [
          {
            title: 'Add to root.tsx',
            description: 'Open `app/root.tsx` and add the script inside `<head>`',
            code: `// app/root.tsx
<head>
  <script
    async
    src="${analyticsUrl}/analytics.js"
    data-site-id="${siteId}"${serverUrlAttr}
  />
</head>`,
            language: 'javascript',
          },
        ],
      };

    case 'gatsby':
      return {
        steps: [
          {
            title: 'Add to gatsby-ssr.js',
            description: 'Create or update `gatsby-ssr.js` in your project root',
            code: `import React from "react"

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <script
      key="betterlytics"
      async
      src="${analyticsUrl}/analytics.js"
      data-site-id="${siteId}"${serverUrlAttr}
    />,
  ])
}`,
            language: 'javascript',
          },
        ],
      };

    case 'angular':
      return {
        steps: [
          {
            title: 'Add to index.html',
            description: 'Paste this in `src/index.html` inside the `<head>` section',
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'solidjs':
      return {
        steps: [
          {
            title: 'Add to index.html',
            description: 'Paste this in your `index.html` inside the `<head>` section',
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'laravel':
      return {
        steps: [
          {
            title: 'Add to your Blade layout',
            description:
              "Paste this in your layout file's `<head>` section (e.g., `resources/views/layouts/app.blade.php`)",
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'wordpress':
      return {
        steps: [
          {
            title: 'Open your theme editor',
            description:
              'Go to **Appearance** > **Theme Editor**, or use a plugin like "Insert Headers and Footers"',
          },
          {
            title: 'Add the tracking script',
            description: 'Paste this before `</head>` in your `header.php`',
            code: trackingScript,
            language: 'html',
          },
        ],
        note: 'Consider using a child theme or plugin to prevent losing changes on theme updates.',
      };

    case 'shopify':
      return {
        steps: [
          {
            title: 'Open theme editor',
            description: 'Go to **Online Store** > **Themes** > **Edit code**',
          },
          {
            title: 'Edit theme.liquid',
            description: 'Open `theme.liquid` in the **Layout** folder',
          },
          {
            title: 'Add the tracking script',
            description: 'Paste this before the closing `</head>` tag',
            code: trackingScript,
            language: 'html',
          },
        ],
        note: 'Theme updates may overwrite your changes. Consider duplicating your theme as a backup.',
      };

    case 'webflow':
      return {
        steps: [
          {
            title: 'Open project settings',
            description: 'Go to **Project Settings** > **Custom Code**',
          },
          {
            title: 'Add the tracking script',
            description: 'Paste this in the **Head Code** section, then publish your site',
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'gtm':
      return {
        steps: [
          {
            title: 'Create a new tag',
            description: 'In **Google Tag Manager**, go to **Tags** > **New** > **Custom HTML**',
          },
          {
            title: 'Add the tracking script',
            description: 'Paste this code and set trigger to **All Pages**',
            code: trackingScript,
            language: 'html',
          },
          {
            title: 'Publish your container',
            description: 'Click **Submit** to publish the changes',
          },
        ],
        note: 'Make sure GTM is properly installed on your website.',
      };

    case 'npm':
      return {
        steps: [
          {
            title: 'Install the package',
            description: 'Run this in your project directory',
            code: 'npm install @betterlytics/tracker',
            language: 'javascript',
          },
          {
            title: 'Initialize the tracker',
            description: "Add this to your app's entry point (e.g., `index.ts`, `main.ts`, or `App.tsx`)",
            code: `import betterlytics from "@betterlytics/tracker"

// Initialize as early as possible in your app
betterlytics.init("${siteId}")`,
            language: 'javascript',
          },
        ],
      };

    default:
      return {
        steps: [
          {
            title: 'Add the tracking script',
            description: 'Paste this in your HTML `<head>` section',
            code: trackingScript,
            language: 'html',
          },
        ],
      };
  }
}
