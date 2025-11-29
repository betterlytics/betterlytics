import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node', // node is faster and all you need
    include: ['**/*.test.ts'], // or whatever folder pattern
    exclude: ['node_modules']
  },
})
