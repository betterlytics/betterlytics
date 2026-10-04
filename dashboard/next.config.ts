import type { NextConfig } from 'next';
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
  // Next streams metadata into <body> for Googlebot by default, but Google only reads canonical and hreflang in <head>
  htmlLimitedBots: /.*/,
  experimental: {
    // app and landing have separate root layouts, so unmatched URLs need a global 404
    globalNotFound: true,
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
      // Single segments the middleware skips (/wp-login.php, /.env, /dashboardx) would hit the static
      // landing as its locale and cache a 404 each; send them to the app's per-request catch-all.
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.devtool = 'source-map';
    }
    return config;
  },
  productionBrowserSourceMaps: false,
};

export default createNextIntlPlugin()(nextConfig);
