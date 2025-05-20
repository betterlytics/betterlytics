import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // node is faster and all you need
    include: ['**/*.test.ts'], // or whatever folder pattern
    exclude: ['node_modules']
  },
})
