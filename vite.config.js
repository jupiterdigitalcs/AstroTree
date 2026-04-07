import { defineConfig } from 'vite'

// Vite config retained only for vitest — the app is now built with Next.js
export default defineConfig({
  test: {
    environment: 'node',
  },
})
