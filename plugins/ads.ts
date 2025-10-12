export default defineNuxtPlugin(nuxtApp => {
  const { public: cfg } = useRuntimeConfig()
  const on = cfg.enableAds === '1'
  const client = cfg.adsenseClient
  // テスト環境用: globalThis.import?.meta?.dev も参照
  const isDev =
    (typeof import.meta !== 'undefined' && import.meta.dev) ||
    (globalThis as unknown as { import?: { meta?: { dev?: boolean } } }).import?.meta?.dev
  if (on && client && !isDev) {
    nuxtApp.hooks.hook('app:created', () => {
      useHead({
        script: [
          {
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
            async: true,
            crossorigin: 'anonymous',
          },
        ],
      })
    })
  }
})
