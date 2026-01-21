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

// Base type with only step1 required
interface Step1Only {
  step1: FrameworkStepTranslations;
  note?: string;
}

// Type with step1 and step2 required
interface Step1And2 extends Step1Only {
  step2: FrameworkStepTranslations;
}

// Type with step1, step2, and step3 required
interface Step1And2And3 extends Step1And2 {
  step3: FrameworkStepTranslations;
}

interface NextjsVariants {
  next153: {
    step1: FrameworkStepTranslations;
    step2: FrameworkStepTranslations;
  };
  approuter: {
    step1: FrameworkStepTranslations;
    step2: FrameworkStepTranslations;
    step3: FrameworkStepTranslations;
  };
  pagesrouter: {
    step1: FrameworkStepTranslations;
    step2: FrameworkStepTranslations;
  };
}

interface NextjsTranslations extends Step1Only {
  variants: NextjsVariants;
}

export interface IntegrationTranslations {
  frameworks: {
    html: Step1Only;
    laravel: Step1Only;
    default: Step1Only;
    react: Step1And2;
    vue: Step1And2;
    nuxt: Step1And2;
    svelte: Step1And2;
    astro: Step1And2;
    remix: Step1And2;
    gatsby: Step1And2;
    angular: Step1And2;
    solidjs: Step1And2;
    wordpress: Step1And2;
    webflow: Step1And2;
    squarespace: Step1And2;
    shopify: Step1And2And3;
    wix: Step1And2And3;
    gtm: Step1And2And3;
    nextjs: NextjsTranslations;
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

  const packageManagerTabs = getPackageManagerTabs();

  switch (frameworkId) {
    case 'html':
      return {
        steps: [
          {
            title: t.frameworks.html.step1.title,
            description: t.frameworks.html.step1.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'laravel':
      return {
        steps: [
          {
            title: t.frameworks.laravel.step1.title,
            description: t.frameworks.laravel.step1.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'nextjs': {
      const nextjsT = t.frameworks.nextjs;
      return {
        variants: [
          {
            id: 'next153',
            label: 'Next.js 15.3+',
            steps: [
              {
                title: nextjsT.variants.next153.step1.title,
                description: nextjsT.variants.next153.step1.description,
                codeTabs: packageManagerTabs,
              },
              {
                title: nextjsT.variants.next153.step2.title,
                description: nextjsT.variants.next153.step2.description,
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
                title: nextjsT.variants.approuter.step1.title,
                description: nextjsT.variants.approuter.step1.description,
                codeTabs: packageManagerTabs,
              },
              {
                title: nextjsT.variants.approuter.step2.title,
                description: nextjsT.variants.approuter.step2.description,
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
                title: nextjsT.variants.approuter.step3.title,
                description: nextjsT.variants.approuter.step3.description,
                code: `import { AnalyticsProvider } from './providers'

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
                title: nextjsT.variants.pagesrouter.step1.title,
                description: nextjsT.variants.pagesrouter.step1.description,
                codeTabs: packageManagerTabs,
              },
              {
                title: nextjsT.variants.pagesrouter.step2.title,
                description: nextjsT.variants.pagesrouter.step2.description,
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
            title: t.frameworks.react.step1.title,
            description: t.frameworks.react.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.react.step2.title,
            description: t.frameworks.react.step2.description,
            code: getSimpleInitCode(siteId),
            language: 'javascript',
          },
        ],
      };

    case 'vue':
      return {
        steps: [
          {
            title: t.frameworks.vue.step1.title,
            description: t.frameworks.vue.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.vue.step2.title,
            description: t.frameworks.vue.step2.description,
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
            title: t.frameworks.nuxt.step1.title,
            description: t.frameworks.nuxt.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.nuxt.step2.title,
            description: t.frameworks.nuxt.step2.description,
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
            title: t.frameworks.svelte.step1.title,
            description: t.frameworks.svelte.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.svelte.step2.title,
            description: t.frameworks.svelte.step2.description,
            code: `<script>
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
            title: t.frameworks.astro.step1.title,
            description: t.frameworks.astro.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.astro.step2.title,
            description: t.frameworks.astro.step2.description,
            code: `<html>
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
            title: t.frameworks.remix.step1.title,
            description: t.frameworks.remix.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.remix.step2.title,
            description: t.frameworks.remix.step2.description,
            code: `import { useEffect } from 'react'
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
            title: t.frameworks.gatsby.step1.title,
            description: t.frameworks.gatsby.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.gatsby.step2.title,
            description: t.frameworks.gatsby.step2.description,
            code: `import betterlytics from "@betterlytics/tracker"

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
            title: t.frameworks.angular.step1.title,
            description: t.frameworks.angular.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.angular.step2.title,
            description: t.frameworks.angular.step2.description,
            code: `import { bootstrapApplication } from '@angular/platform-browser'
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
            title: t.frameworks.solidjs.step1.title,
            description: t.frameworks.solidjs.step1.description,
            codeTabs: packageManagerTabs,
          },
          {
            title: t.frameworks.solidjs.step2.title,
            description: t.frameworks.solidjs.step2.description,
            code: `import { render } from 'solid-js/web'
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
            title: t.frameworks.wordpress.step1.title,
            description: t.frameworks.wordpress.step1.description,
          },
          {
            title: t.frameworks.wordpress.step2.title,
            description: t.frameworks.wordpress.step2.description,
            code: trackingScript,
            language: 'html',
          },
        ],
        note: t.frameworks.wordpress.note,
      };

    case 'shopify':
      return {
        steps: [
          {
            title: t.frameworks.shopify.step1.title,
            description: t.frameworks.shopify.step1.description,
          },
          {
            title: t.frameworks.shopify.step2.title,
            description: t.frameworks.shopify.step2.description,
          },
          {
            title: t.frameworks.shopify.step3.title,
            description: t.frameworks.shopify.step3.description,
            code: trackingScript,
            language: 'html',
          },
        ],
        note: t.frameworks.shopify.note,
      };

    case 'webflow':
      return {
        steps: [
          {
            title: t.frameworks.webflow.step1.title,
            description: t.frameworks.webflow.step1.description,
          },
          {
            title: t.frameworks.webflow.step2.title,
            description: t.frameworks.webflow.step2.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'wix':
      return {
        steps: [
          {
            title: t.frameworks.wix.step1.title,
            description: t.frameworks.wix.step1.description,
          },
          {
            title: t.frameworks.wix.step2.title,
            description: t.frameworks.wix.step2.description,
            code: trackingScript,
            language: 'html',
          },
          {
            title: t.frameworks.wix.step3.title,
            description: t.frameworks.wix.step3.description,
          },
        ],
        note: t.frameworks.wix.note,
      };

    case 'squarespace':
      return {
        steps: [
          {
            title: t.frameworks.squarespace.step1.title,
            description: t.frameworks.squarespace.step1.description,
          },
          {
            title: t.frameworks.squarespace.step2.title,
            description: t.frameworks.squarespace.step2.description,
            code: trackingScript,
            language: 'html',
          },
        ],
        note: t.frameworks.squarespace.note,
      };

    case 'gtm':
      return {
        steps: [
          {
            title: t.frameworks.gtm.step1.title,
            description: t.frameworks.gtm.step1.description,
          },
          {
            title: t.frameworks.gtm.step2.title,
            description: t.frameworks.gtm.step2.description,
            code: trackingScript,
            language: 'html',
          },
          {
            title: t.frameworks.gtm.step3.title,
            description: t.frameworks.gtm.step3.description,
          },
        ],
        note: t.frameworks.gtm.note,
      };

    default:
      return {
        steps: [
          {
            title: t.frameworks.default.step1.title,
            description: t.frameworks.default.step1.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };
  }
}
