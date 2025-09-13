// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: {
    strict: true,
  },
  modules: [
    // '@nuxt/content' - 一時的に無効化（zod v4依存関係の競合のため）
  ],
})
