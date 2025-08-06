import type { NextConfig } from 'next';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the root directory
const rootDir = path.resolve(process.cwd(), '..');
const envPath = path.join(rootDir, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Could not load .env file from root:', result.error.message);
}

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
