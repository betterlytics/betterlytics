import type { NextConfig } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import createNextIntlPlugin from 'next-intl/plugin';

// Load environment variables from the root directory
const rootDir = path.resolve(process.cwd(), '..');
const envPath = path.join(rootDir, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Could not load .env file from root:', result.error.message);
}

function hasPageFile(dir: string): boolean {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name === 'page.tsx' || entry.name === 'page.ts')) return true;
    if (entry.isDirectory() && hasPageFile(path.join(dir, entry.name))) return true;
  }
  return false;
}

function getLocaleRouteSegments(dir: string): string[] {
  const segments: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
      segments.push(...getLocaleRouteSegments(path.join(dir, entry.name)));
    } else if (!entry.name.startsWith('[') && hasPageFile(path.join(dir, entry.name))) {
      segments.push(entry.name);
    }
  }
  return segments;
}

const localeRouteSegments = getLocaleRouteSegments(path.join(process.cwd(), 'src/app/[locale]'));

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    LOCALE_ROUTE_SEGMENTS: JSON.stringify(localeRouteSegments),
  },
  async redirects() {
    return [
      { source: '/login', destination: '/signin', permanent: true },
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/:locale/login', destination: '/:locale/signin', permanent: true },
      { source: '/:locale/register', destination: '/:locale/signup', permanent: true },
    ];
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
