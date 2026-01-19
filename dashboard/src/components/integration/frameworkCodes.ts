import { FrameworkId } from './FrameworkGrid';

interface FrameworkCodeConfig {
  siteId: string;
  analyticsUrl: string;
  serverUrl?: string;
  isCloud: boolean;
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
}

export interface IntegrationTranslations {
  frameworks: {
    [key: string]: FrameworkTranslations;
  };
}

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

export function getFrameworkCode(
  frameworkId: FrameworkId,
  config: FrameworkCodeConfig,
  t: IntegrationTranslations,
): FrameworkCode {
  const { siteId, analyticsUrl, serverUrl, isCloud } = config;
  const serverUrlAttr = !isCloud && serverUrl ? `\n    data-server-url="${serverUrl}"` : '';
  const serverUrlJS = !isCloud && serverUrl ? `\n    script.setAttribute('data-server-url', "${serverUrl}");` : '';

  const trackingScript = `<script async
    src="${analyticsUrl}/analytics.js"
    data-site-id="${siteId}"${serverUrlAttr}>
</script>`;

  const getT = (id: string) => t.frameworks[id] || t.frameworks['default'];

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

    case 'nextjs':
      return {
        steps: [
          {
            title: getT('nextjs').step1.title,
            description: getT('nextjs').step1.description,
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
      <body>{children}</body>
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
            title: getT('react').step1.title,
            description: getT('react').step1.description,
            code: `import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const script = document.createElement('script')
    script.async = true
    script.src = "${analyticsUrl}/analytics.js"
    script.setAttribute('data-site-id', "${siteId}")${serverUrlJS}
    document.head.appendChild(script)
  }, [])

  return <>{/* ... */}</>
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
            title: getT('vue').step1.title,
            description: getT('vue').step1.description,
            code: `import { createApp } from 'vue'
import App from './App.vue'

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
            title: getT('nuxt').step1.title,
            description: getT('nuxt').step1.description,
            code: `export default defineNuxtConfig({
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
            title: getT('svelte').step1.title,
            description: getT('svelte').step1.description,
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
            title: getT('astro').step1.title,
            description: getT('astro').step1.description,
            code: `---
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
            title: getT('remix').step1.title,
            description: getT('remix').step1.description,
            code: `<head>
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
            title: getT('gatsby').step1.title,
            description: getT('gatsby').step1.description,
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
            title: getT('angular').step1.title,
            description: getT('angular').step1.description,
            code: trackingScript,
            language: 'html',
          },
        ],
      };

    case 'solidjs':
      return {
        steps: [
          {
            title: getT('solidjs').step1.title,
            description: getT('solidjs').step1.description,
            code: trackingScript,
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

    case 'npm':
      return {
        steps: [
          {
            title: getT('npm').step1.title,
            description: getT('npm').step1.description,
            code: 'npm install @betterlytics/tracker',
            language: 'javascript',
          },
          {
            title: getT('npm').step2!.title,
            description: getT('npm').step2!.description,
            code: `import betterlytics from "@betterlytics/tracker"

betterlytics.init("${siteId}")`,
            language: 'javascript',
          },
        ],
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
