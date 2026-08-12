import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/lecture-crm/',
  test: {
    environment: 'jsdom',
  },
  build: {
    outDir: 'dist',
  },
})
