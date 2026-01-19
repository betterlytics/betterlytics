import { FrameworkId } from './FrameworkGrid';

export interface CodeTab {
  id: string;
  label: string;
  code: string;
  language: 'html' | 'javascript' | 'bash';
}

export interface FrameworkStep {
  title: string;
  description?: string;
  code?: string;
  language?: 'html' | 'javascript' | 'bash';
  codeTabs?: CodeTab[];
}

export interface FrameworkVariant {
  id: string;
  label: string;
  steps: FrameworkStep[];
}

export interface FrameworkCode {
  variants?: FrameworkVariant[];
  steps?: FrameworkStep[];
  note?: string;
}

interface FrameworkStepTranslations {
  title: string;
  description?: string;
}

interface FrameworkTranslations {
  step1: FrameworkStepTranslations;
  step2?: FrameworkStepTranslations;
  step3?: FrameworkStepTranslations;
  note?: string;
  variants?: {
    [variantId: string]: {
      step1?: FrameworkStepTranslations;
      step2?: FrameworkStepTranslations;
      step3?: FrameworkStepTranslations;
    };
  };
}

export interface IntegrationTranslations {
  frameworks: {
    [key: string]: FrameworkTranslations;
  };
}

interface FrameworkCodeConfig {
  siteId: string;
  analyticsUrl: string;
  serverUrl?: string;
  isCloud: boolean;
}

function getPackageManagerTabs(): CodeTab[] {
  return [
    { id: 'npm', label: 'npm', code: 'npm install @betterlytics/tracker', language: 'bash' },
    { id: 'yarn', label: 'yarn', code: 'yarn add @betterlytics/tracker', language: 'bash' },
    { id: 'pnpm', label: 'pnpm', code: 'pnpm add @betterlytics/tracker', language: 'bash' },
  ];
}

function getSimpleInitCode(siteId: string): string {
  return `import betterlytics from "@betterlytics/tracker"

betterlytics.init("${siteId}")`;
}

export function getFrameworkCode(
  frameworkId: FrameworkId,
  config: FrameworkCodeConfig,
  t: IntegrationTranslations,
): FrameworkCode {
  const { siteId, analyticsUrl, serverUrl, isCloud } = config;
  const serverUrlAttr = !isCloud && serverUrl ? `\n    data-server-url="${serverUrl}"` : '';

  const trackingScript = `<script async
    src="${analyticsUrl}/analytics.js"
    data-site-id="${siteId}"${serverUrlAttr}>
</script>`;

  const getT = (id: string) => t.frameworks[id];
  const packageManagerTabs = getPackageManagerTabs();

  switch (frameworkId) {
    case 'html':
      return {
        steps: [
          {
            title: getT('html').step1.title,
            description: getT('html').step1.description,
            code: `<head>
  ${trackingScript}
</head>`,
            language: 'html',
          },
        ],
      };

    case 'laravel':
      return {
        steps: [
          {
            title: getT('laravel').step1.title,
            description: getT('laravel').step1.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'nextjs': {
      const nextjsT = getT('nextjs');
      return {
        variants: [
          {
            id: 'next153',
            label: 'Next.js 15.3+',
            steps: [
              {
                title: nextjsT.variants!.next153.step1!.title,
                description: nextjsT.variants!.next153.step1!.description,
                codeTabs: packageManagerTabs,
              },
              {
                title: nextjsT.variants!.next153.step2!.title,
                description: nextjsT.variants!.next153.step2!.description,
                code: getSimpleInitCode(siteId),
                language: 'javascript',
              },
            ],
          },
          {
            id: 'approuter',
            label: 'App Router',
            steps: [
              {
                title: nextjsT.variants!.approuter.step1!.title,
                description: nextjsT.variants!.approuter.step1!.description,
                codeTabs: packageManagerTabs,
              },
              {
                title: nextjsT.variants!.approuter.step2!.title,
                description: nextjsT.variants!.approuter.step2!.description,
                code: `'use client'

import { useEffect } from 'react'
import betterlytics from "@betterlytics/tracker"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    betterlytics.init("${siteId}")
  }, [])

  return <>{children}</>
}`,
                language: 'javascript',
              },
              {
                title: nextjsT.variants!.approuter.step3!.title,
                description: nextjsT.variants!.approuter.step3!.description,
                code: `// app/layout.tsx
import { AnalyticsProvider } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}`,
                language: 'javascript',
              },
            ],
          },
          {
            id: 'pagesrouter',
            label: 'Pages Router',
            steps: [
              {
                title: nextjsT.variants!.pagesrouter.step1!.title,
                description: nextjsT.variants!.pagesrouter.step1!.description,
                codeTabs: packageManagerTabs,
              },
              {
                title: nextjsT.variants!.pagesrouter.step2!.title,
                description: nextjsT.variants!.pagesrouter.step2!.description,
                code: `import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import betterlytics from "@betterlytics/tracker"

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    betterlytics.init("${siteId}")
  }, [])

  return <Component {...pageProps} />
}`,
                language: 'javascript',
              },
            ],
          },
        ],
      };
    }

    case 'react':
      return {
        steps: [
          {
            title: getT('react').step1.title,
            description: getT('react').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('react').step2!.title,
            description: getT('react').step2!.description,
            code: getSimpleInitCode(siteId),
            language: 'javascript',
          },
        ],
      };

    case 'vue':
      return {
        steps: [
          {
            title: getT('vue').step1.title,
            description: getT('vue').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('vue').step2!.title,
            description: getT('vue').step2!.description,
            code: `import { createApp } from 'vue'
import App from './App.vue'
import betterlytics from "@betterlytics/tracker"

betterlytics.init("${siteId}")

createApp(App).mount('#app')`,
            language: 'javascript',
          },
        ],
      };

    case 'nuxt':
      return {
        steps: [
          {
            title: getT('nuxt').step1.title,
            description: getT('nuxt').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('nuxt').step2!.title,
            description: getT('nuxt').step2!.description,
            code: `// plugins/betterlytics.client.ts
import betterlytics from "@betterlytics/tracker"

export default defineNuxtPlugin(() => {
  betterlytics.init("${siteId}")
})`,
            language: 'javascript',
          },
        ],
      };

    case 'svelte':
      return {
        steps: [
          {
            title: getT('svelte').step1.title,
            description: getT('svelte').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('svelte').step2!.title,
            description: getT('svelte').step2!.description,
            code: `<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte'
  import betterlytics from '@betterlytics/tracker'

  onMount(() => {
    betterlytics.init('${siteId}')
  })
</script>

<slot />`,
            language: 'html',
          },
        ],
      };

    case 'astro':
      return {
        steps: [
          {
            title: getT('astro').step1.title,
            description: getT('astro').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('astro').step2!.title,
            description: getT('astro').step2!.description,
            code: `<!-- src/layouts/Layout.astro -->
<html>
  <head>
    <!-- ... -->
  </head>
  <body>
    <slot />
    <script>
      import betterlytics from '@betterlytics/tracker'
      betterlytics.init('${siteId}')
    </script>
  </body>
</html>`,
            language: 'html',
          },
        ],
      };

    case 'remix':
      return {
        steps: [
          {
            title: getT('remix').step1.title,
            description: getT('remix').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('remix').step2!.title,
            description: getT('remix').step2!.description,
            code: `// app/root.tsx
import { useEffect } from 'react'
import betterlytics from "@betterlytics/tracker"

export default function App() {
  useEffect(() => {
    betterlytics.init("${siteId}")
  }, [])

  return (
    <html>
      <head>{/* ... */}</head>
      <body>{/* ... */}</body>
    </html>
  )
}`,
            language: 'javascript',
          },
        ],
      };

    case 'gatsby':
      return {
        steps: [
          {
            title: getT('gatsby').step1.title,
            description: getT('gatsby').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('gatsby').step2!.title,
            description: getT('gatsby').step2!.description,
            code: `// gatsby-browser.js
import betterlytics from "@betterlytics/tracker"

export const onClientEntry = () => {
  betterlytics.init("${siteId}")
}`,
            language: 'javascript',
          },
        ],
      };

    case 'angular':
      return {
        steps: [
          {
            title: getT('angular').step1.title,
            description: getT('angular').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('angular').step2!.title,
            description: getT('angular').step2!.description,
            code: `// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import betterlytics from "@betterlytics/tracker"

betterlytics.init("${siteId}")

bootstrapApplication(AppComponent)`,
            language: 'javascript',
          },
        ],
      };

    case 'solidjs':
      return {
        steps: [
          {
            title: getT('solidjs').step1.title,
            description: getT('solidjs').step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: getT('solidjs').step2!.title,
            description: getT('solidjs').step2!.description,
            code: `// src/index.tsx
import { render } from 'solid-js/web'
import App from './App'
import betterlytics from "@betterlytics/tracker"

betterlytics.init("${siteId}")

render(() => <App />, document.getElementById('root')!)`,
            language: 'javascript',
          },
        ],
      };

    case 'wordpress':
      return {
        steps: [
          {
            title: getT('wordpress').step1.title,
            description: getT('wordpress').step1.description,
          },
          {
            title: getT('wordpress').step2!.title,
            description: getT('wordpress').step2!.description,
            code: trackingScript,
            language: 'html',
          },
        ],
        note: getT('wordpress').note,
      };

    case 'shopify':
      return {
        steps: [
          {
            title: getT('shopify').step1.title,
            description: getT('shopify').step1.description,
          },
          {
            title: getT('shopify').step2!.title,
            description: getT('shopify').step2!.description,
          },
          {
            title: getT('shopify').step3!.title,
            description: getT('shopify').step3!.description,
            code: trackingScript,
            language: 'html',
          },
        ],
        note: getT('shopify').note,
      };

    case 'webflow':
      return {
        steps: [
          {
            title: getT('webflow').step1.title,
            description: getT('webflow').step1.description,
          },
          {
            title: getT('webflow').step2!.title,
            description: getT('webflow').step2!.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'wix':
      return {
        steps: [
          {
            title: getT('wix').step1.title,
            description: getT('wix').step1.description,
          },
          {
            title: getT('wix').step2!.title,
            description: getT('wix').step2!.description,
            code: trackingScript,
            language: 'html',
          },
          {
            title: getT('wix').step3!.title,
            description: getT('wix').step3!.description,
          },
        ],
        note: getT('wix').note,
      };

    case 'squarespace':
      return {
        steps: [
          {
            title: getT('squarespace').step1.title,
            description: getT('squarespace').step1.description,
          },
          {
            title: getT('squarespace').step2!.title,
            description: getT('squarespace').step2!.description,
            code: trackingScript,
            language: 'html',
          },
        ],
        note: getT('squarespace').note,
      };

    case 'gtm':
      return {
        steps: [
          {
            title: getT('gtm').step1.title,
            description: getT('gtm').step1.description,
          },
          {
            title: getT('gtm').step2!.title,
            description: getT('gtm').step2!.description,
            code: trackingScript,
            language: 'html',
          },
          {
            title: getT('gtm').step3!.title,
            description: getT('gtm').step3!.description,
          },
        ],
        note: getT('gtm').note,
      };

    default:
      return {
        steps: [
          {
            title: getT('default').step1.title,
            description: getT('default').step1.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };
  }
}
