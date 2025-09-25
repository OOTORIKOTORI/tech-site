// プラグイン (Nitro): queryContent をグローバルへ公開 (tests で stub 可能な形)
// NOTE: server/plugins 下では '#app' を import せずサーバ向けエントリを直接利用
// @ts-expect-error runtime export provided by @nuxt/content (server entry may not have types)
import { queryContent } from '#content/server'

export default () => {
  // 既に stub 済み (tests) / 他プラグインで設定済みなら上書きしない
  const g = globalThis as unknown as { queryContent?: typeof queryContent }
  if (typeof g.queryContent !== 'function') {
    g.queryContent = queryContent as typeof g.queryContent
  }
}
