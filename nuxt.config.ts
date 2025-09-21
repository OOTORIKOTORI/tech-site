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
      // 新しい統一キー（既定は本番ドメイン）
      siteOrigin: process.env.NUXT_PUBLIC_SITE_ORIGIN || 'https://migakiexplorer.jp',
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || '磨きエクスプローラー',
      // 互換キー（古い参照が残っていても落ちないように保持）
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        process.env.NUXT_PUBLIC_SITE_ORIGIN ||
        'http://localhost:3000',
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
      '/api/og/**': { headers: { 'Cache-Control': 'no-store' } },
    },
    prerender: {
      // 内部APIは静的化しない
      ignore: ['/__nuxt_content/**'],
      // 念のため：取りこぼしがあってもビルド継続
      failOnError: false,
    },
  },
  hooks: {
    ready: () => {
      if (
        !process.env.NUXT_PUBLIC_SITE_ORIGIN &&
        process.env.NODE_ENV !== 'test' &&
        process.env.NODE_ENV !== 'production'
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          '[nuxt] NUXT_PUBLIC_SITE_ORIGIN 未設定のためデフォルト https://migakiexplorer.jp を使用します'
        )
      }
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [],
    },
  },
})
