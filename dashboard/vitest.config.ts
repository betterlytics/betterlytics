import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // Next's tsconfig uses jsx: preserve; React Email templates under test need the automatic runtime.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'src/test/server-only-stub.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Email templates parse the shared env at import time.
    env: { PUBLIC_BASE_URL: 'http://localhost:3000' },
    include: ['**/*.test.ts'],
    exclude: ['node_modules']
  },
})
