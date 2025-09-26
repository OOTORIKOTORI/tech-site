import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    clearMocks: true,
    environmentOptions: {
      jsdom: { url: 'https://migakiexplorer.jp' },
    },
    globals: true,
    setupFiles: ['tests/setup/global-stubs.ts', 'tests/setup/console-warn-filter.ts'],
    onConsoleLog(log, type) {
      if (
        (type === 'stdout' || type === 'stderr') &&
        /<Suspense>\s+is an experimental feature/i.test(log)
      ) {
        return false
      }
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '#imports': fileURLToPath(new URL('./tests/_stubs/nuxt-imports.ts', import.meta.url)),
      '#content': fileURLToPath(new URL('./tests/_stubs/nuxt-content.ts', import.meta.url)),
    },
  },
})
