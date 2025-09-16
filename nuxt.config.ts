import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/sitemap', '@nuxtjs/feed'],
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
    highlight: {
      theme: 'github-dark',
      preload: ['js', 'ts', 'json', 'bash', 'vue', 'md'],
    },
    markdown: {
      toc: { depth: 3, searchDepth: 3 },
      anchorLinks: true,
    },
  },

  sitemap: {
    hostname: 'https://tech-site-docs.com',
    gzip: true,
    routes: async () => [],
  },
  feed: [
    {
      path: '/feed.xml',
      type: 'rss2',
      create: async () => {
        const { serverQueryContent } = await import('#content/server')
        const list = await serverQueryContent('/blog').find()
        return {
          title: 'Tech Site Blog RSS',
          link: 'https://tech-site-docs.com/feed.xml',
          description: 'Tech Siteの技術ブログRSS',
          items: list.map((a: any) => ({
            title: a.title,
            link: `https://tech-site-docs.com${a._path}`,
            description: a.description,
            pubDate: a.date,
          })),
        }
      },
    },
  ],
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
