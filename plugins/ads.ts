export default defineNuxtPlugin(() => {
  const { public: pub } = useRuntimeConfig()
  const cfg = pub as typeof pub & {
    enableAds?: string
    adsenseClient?: string
  }
  const on = cfg.enableAds === '1'
  const client = cfg.adsenseClient
  if (on && client && !import.meta.dev) {
    useHead({
      script: [
        {
          src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
          async: true,
          crossorigin: 'anonymous',
        },
      ],
    })
  }
})
