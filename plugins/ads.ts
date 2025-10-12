export default defineNuxtPlugin(nuxtApp => {
  const { public: cfg } = useRuntimeConfig()
  const on = cfg.enableAds === '1'
  const client = cfg.adsenseClient
  if (on && client && !import.meta.dev) {
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
