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
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    autoLastmod: true,
    xsl: false,
    defaults: { changefreq: 'weekly' },
  },
  nitro: {
    routeRules: {
      '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/favicon.ico': { headers: { 'cache-control': 'public, max-age=86400' } },
      '/sitemap.xml': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/robots.txt': { headers: { 'cache-control': 'public, max-age=3600' } },
    },
  },
  hooks: {
    ready: () => {
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
      titleTemplate: '%s - Tech Tools & Notes',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '便利ツールと実務ノウハウの技術サイト' },
        { property: 'og:site_name', content: 'Tech Tools & Notes' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Tech Tools & Notes' },
        { property: 'og:description', content: '便利ツールと実務ノウハウの技術サイト' },
        { property: 'og:image', content: '/og-default.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [{ rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml', title: 'RSS' }],
    },
  },
})
