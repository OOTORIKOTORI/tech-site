import { useHead } from '#imports'

export default defineNuxtPlugin(() => {
  useHead({
    meta: [
      { property: 'og:site_name', content: 'Migaki Explorer' },
      { property: 'og:locale', content: 'ja_JP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: 'og:image', content: '/og/og-default.png' },
      { name: 'twitter:image', content: '/og/og-default.png' },
    ],
  })
})
