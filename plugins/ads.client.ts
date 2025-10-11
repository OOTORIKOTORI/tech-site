export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Dev環境では常に無効
  if (process.dev) {
    return
  }

  // VERCEL_ENVがproductionまたはpreviewでのみ許可
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv !== 'production' && vercelEnv !== 'preview') {
    return
  }

  // フラグとクライアントIDが両方設定されているときのみ有効
  if (config.public.enableAds === '1' && config.public.adsenseClient) {
    useHead({
      script: [
        {
          async: true,
          src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.public.adsenseClient}`,
          crossorigin: 'anonymous',
        },
      ],
    })
  }
})
