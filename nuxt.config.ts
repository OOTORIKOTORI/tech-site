import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/sitemap'],
  css: ['@@/assets/css/tailwind.css'],
  pages: true,

  tailwindcss: {
    cssPath: '@@/assets/css/tailwind.css',
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: { strict: true },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    // highlight: { theme: 'github-dark' }, // 型不一致の可能性があるため保留
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },
  hooks: {
    ready: nuxt => {
      if (!process.env.NUXT_PUBLIC_SITE_URL && process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn(
          '[nuxt] NUXT_PUBLIC_SITE_URL 未設定のためデフォルト http://localhost:3000 を使用します'
        )
      }
    },
  },
  app: {
    head: {
      title: 'Tech Tools & Notes',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '便利ツールと実務ノウハウの技術サイト' },
      ],
      link: [{ rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml', title: 'RSS' }],
    },
  },
})
