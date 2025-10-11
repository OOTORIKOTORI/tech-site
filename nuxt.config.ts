import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/sitemap'],
  plugins: ['~/plugins/meta-defaults.client.ts'],
  css: ['@@/assets/css/tailwind.css'],
  pages: true,
  // Rely on @nuxt/content to provide queryContent via auto-imports; do not re-register here
  // imports: { presets: [] },
  alias: {
    '#content/server': '@nuxt/content/nitro',
  },

  tailwindcss: {
    cssPath: '@@/assets/css/tailwind.css',
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  typescript: { strict: true },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    // @ts-expect-error - type defs may lag behind content runtime options
    highlight: {
      theme: 'github-light',
      preload: ['ts', 'js', 'json', 'bash', 'diff', 'vue', 'html', 'md'],
    },
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
  // 静的化対象から除外
  routeRules: {
    '/**': {
      prerender: false,
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer-when-downgrade',
        'Permissions-Policy': 'interest-cohort=()',
        'Content-Security-Policy-Report-Only':
          "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'",
      },
    },
    '/blog': { prerender: false },
    '/blog/**': { prerender: false },
    '/api/**': { prerender: false },
  },
  nitro: {
    alias: {
      '#content/server': '@nuxt/content/nitro',
    },
    routeRules: {
      '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/favicon.ico': { headers: { 'cache-control': 'public, max-age=86400' } },
      '/sitemap.xml': {
        headers: {
          'cache-control': 'public, max-age=3600',
          'Content-Type': 'application/xml; charset=utf-8',
        },
      },
      '/feed.xml': {
        headers: {
          'cache-control': 'public, max-age=3600',
          'Content-Type': 'application/xml; charset=utf-8',
        },
      },
      '/robots.txt': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/api/og/**': { headers: { 'Cache-Control': 'no-store' } },
      // v2 blog/API は動的に提供するため静的化しない
      '/blog': { prerender: false },
      '/blog/**': { prerender: false },
      '/api/**': { prerender: false },
    },
    prerender: {
      // 内部APIは静的化しない
      ignore: ['/__nuxt_content/**', '/blog', '/blog/**', '/api/**'],
      crawlLinks: false,
      routes: [],
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
      link: [
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'Migaki Explorer',
          href: '/feed.xml',
        },
      ],
    },
  },
  vite: { resolve: { alias: { '#content/server': '@nuxt/content/nitro' } } },
})
