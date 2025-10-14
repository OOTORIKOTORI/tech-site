// plugins/ads.ts
import { useHead, useRuntimeConfig } from '#imports'

type AdsPublic = {
  enableAds?: string | number | boolean | null | undefined
  adsenseClient?: string | null | undefined
  siteOrigin?: string | null | undefined
}

function toEnabledFlag(val: unknown): boolean {
  const s = String(val ?? '')
    .trim()
    .toLowerCase()
  return s === '1' || s === 'true' || s === 'on'
}

export default defineNuxtPlugin(() => {
  // SSRガードは撤廃（jsdom等のテスト環境でも同期発火させる）
  const pub = useRuntimeConfig().public as unknown as AdsPublic

  // Prod判定（テスト側で NODE_ENV / VERCEL_ENV を上書きする前提）
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

  const enabled = toEnabledFlag(pub?.enableAds)
  const client = typeof pub?.adsenseClient === 'string' ? pub.adsenseClient.trim() : ''
  const origin = typeof pub?.siteOrigin === 'string' ? pub.siteOrigin : ''

  // 本番ドメインのみに制限
  const originOk = !origin || /migakiexplorer\.jp/i.test(origin)

  if (!(isProd && enabled && client && originOk)) return

  // 同期で即時注入（spyが観測できる）
  useHead({
    script: [
      {
        key: 'adsbygoogle',
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
          client
        )}`,
        async: true,
        crossorigin: 'anonymous',
      },
    ],
  })
})
