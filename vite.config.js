import { defineConfig } from 'vite'

// Vite config retained only for vitest — the app is now built with Next.js
export default defineConfig({
  test: {
    environment: 'node',
    // Exclude Playwright e2e tests — they're run via `npm run test:e2e`
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
})
