import type { NextConfig } from 'next';
import { HTML_LIMITED_BOT_UA_RE } from 'next/dist/shared/lib/router/utils/html-bots';
import * as path from 'path';
import dotenv from 'dotenv';
import createNextIntlPlugin from 'next-intl/plugin';
import { SUPPORTED_LANGUAGES } from './src/constants/i18n';

// Load environment variables from the root directory
const rootDir = path.resolve(process.cwd(), '..');
const envPath = path.join(rootDir, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Could not load .env file from root:', result.error.message);
}

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next's list omits Googlebot and AI crawlers; Google ignores canonical and hreflang streamed into <body>
  htmlLimitedBots: new RegExp(
    `${HTML_LIMITED_BOT_UA_RE.source}|Googlebot|GPTBot|OAI-SearchBot|PerplexityBot|ClaudeBot`,
    'i',
  ),
  experimental: {
    // app and landing have separate root layouts, so unmatched URLs need a global 404
    globalNotFound: true,
    webpackMemoryOptimizations: true,
    serverSourceMaps: true,
  },
  async redirects() {
    return [
      { source: '/login', destination: '/signin', permanent: true },
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/:locale/login', destination: '/:locale/signin', permanent: true },
      { source: '/:locale/register', destination: '/:locale/signup', permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      // Dotted segments the middleware skips (/wp-login.php) would each cache a 404 as a landing locale
      afterFiles: [
        {
          source: `/:segment((?!(?:${SUPPORTED_LANGUAGES.join('|')})$)[^/]+)`,
          destination: `/${process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'en'}/:segment`,
        },
      ],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'X-Accel-Buffering', value: 'no' }],
      },
    ];
  },
  productionBrowserSourceMaps: false,
};

export default createNextIntlPlugin()(nextConfig);
