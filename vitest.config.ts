import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Standalone Vitest config (electron-vite's config is for the app build, not
// tests). Mirrors the renderer's React + `@renderer` alias so tests import the
// same way the app does.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup/vitest.setup.ts'],
    include: ['src/tests/**/*.{test,spec}.{ts,tsx}'],
    // Tests validate logic, not styles — skip CSS processing for speed/isolation.
    css: false
  }
})
