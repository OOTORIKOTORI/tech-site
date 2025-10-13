import { useHead, useRuntimeConfig } from '#imports'

// 型ゆらぎ許容: 1/'1'/true/'true'/'on' で有効扱い
function toEnabledFlag(val: unknown): boolean {
  if (typeof val === 'string') return /^(1|true|on)$/i.test(val.trim())
  return val === 1 || val === true
}

// defineNuxtPlugin を #app/#imports からimportしない
type NuxtAppLike = { hooks: { hookOnce: (name: string, cb: () => void) => void } }
type DefineNuxtPlugin = (fn: (nuxtApp: NuxtAppLike) => unknown) => unknown
const register: DefineNuxtPlugin =
  typeof (globalThis as { defineNuxtPlugin?: unknown }).defineNuxtPlugin === 'function'
    ? (globalThis as unknown as { defineNuxtPlugin: DefineNuxtPlugin }).defineNuxtPlugin
    : fn => {
        fn({ hooks: { hookOnce: (_n, cb) => cb() } } as NuxtAppLike)
        return {}
      }

export default register(() => {
  const isDev =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { dev?: boolean }).dev === true) ||
    Boolean((globalThis as { import?: { meta?: { dev?: boolean } } }).import?.meta?.dev)
  if (isDev) return
  const { enableAds, adsenseClient } = useRuntimeConfig().public as {
    enableAds?: unknown
    adsenseClient?: unknown
  }
  if (!toEnabledFlag(enableAds)) return
  const client = typeof adsenseClient === 'string' ? adsenseClient.trim() : ''
  if (!client) return
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
