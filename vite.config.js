import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'xyflow': ['@xyflow/react'],
          'dagre': ['@dagrejs/dagre'],
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
