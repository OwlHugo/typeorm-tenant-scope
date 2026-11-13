import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // The specs share one database and truncate between tests.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/demo.ts', 'src/testing/**'],
      thresholds: { lines: 85, branches: 75, functions: 90 },
    },
  },
})
