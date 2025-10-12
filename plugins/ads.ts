import type { H3Event } from 'h3'

export default defineNuxtPlugin(nuxtApp => {
  const { public: cfg } = useRuntimeConfig()

  // enableAds の型ゆらぎ(1, '1', true, 'true', 'on')を許容
  type AdsPublic = { enableAds?: unknown; adsenseClient?: unknown }
  const pub = cfg as unknown as AdsPublic
  const flag = String(pub.enableAds ?? '').toLowerCase()
  const enabled = flag === '1' || flag === 'true' || flag === 'on'
  const client = typeof pub.adsenseClient === 'string' ? pub.adsenseClient.trim() : ''

  // テスト環境用: globalThis.import?.meta?.dev も参照
  const isDev =
    (typeof import.meta !== 'undefined' && import.meta.dev) ||
    (globalThis as unknown as { import?: { meta?: { dev?: boolean } } }).import?.meta?.dev

  if (!isDev && enabled && client) {
    // SSR時にデバッグフラグが立っていればレスポンスヘッダを付与
    if (import.meta.server) {
      try {
        const event = nuxtApp.ssrContext?.event as H3Event | undefined
        const dbg = String(process.env.ENABLE_ADS_DEBUG || '').toLowerCase()
        if (event && (dbg === '1' || dbg === 'true' || dbg === 'on')) {
          // h3 の setHeader に依存せず直接設定して副作用最小化
          event.node?.res?.setHeader?.('X-Ads-Script', '1')
        }
      } catch {
        // noop
      }
    }

    nuxtApp.hooks.hook('app:created', () => {
      // 既に同srcが存在する場合は二重注入しない（軽いガード）
      if (typeof document !== 'undefined') {
        const headHtml = document.head?.innerHTML || ''
        if (headHtml.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) {
          return
        }
      }
      // SSR/CSR間での重複呼び出し防止のため簡易フラグ
      const payload = nuxtApp.payload as typeof nuxtApp.payload & { _adsScriptInjected?: boolean }
      if (payload && payload._adsScriptInjected) return
      if (payload) payload._adsScriptInjected = true

      useHead({
        script: [
          {
            key: 'adsbygoogle',
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
            async: true,
            crossorigin: 'anonymous',
          },
        ],
      })
    })
  }
})
