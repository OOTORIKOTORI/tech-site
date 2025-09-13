import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: { strict: true },

  modules: ['@nuxt/content', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],

  //  ここでpostcssを設定（postcss.config.jsは不要）
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: { theme: 'github-dark' },
      },
    },
  },

  app: {
    head: {
      title: 'Tech Tools & Notes',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '便利ツールと実務ノウハウの技術サイト' },
      ],
    },
  },
})
