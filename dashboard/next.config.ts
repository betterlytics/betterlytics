import type { NextConfig } from 'next';
import * as path from 'path';
import dotenv from 'dotenv';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

// Load environment variables from the root directory
const rootDir = path.resolve(process.cwd(), '..');
const envPath = path.join(rootDir, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Could not load .env file from root:', result.error.message);
}

const withNextIntl = createNextIntlPlugin();
const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'mdx'],
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'X-Accel-Buffering', value: 'no' }],
      },
    ];
  },
};

export default withNextIntl(withMDX(nextConfig));
