export default defineNuxtPlugin(() => {
  const { public: pub } = useRuntimeConfig()
  const cfg = pub as typeof pub & {
    enableAds?: string
    adsenseClient?: string
    vercelEnv?: string
  }
  const enable = cfg.enableAds === '1'
  const client = cfg.adsenseClient
  const env = (cfg.vercelEnv ?? '').toLowerCase()
  const isProdLike = env === 'production' || env === 'preview'
  // Dev では常に無効。Preview/Production かつフラグ/IDが揃った場合のみ挿入。
  if (enable && client && isProdLike && !import.meta.dev) {
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
