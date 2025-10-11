// --- useStorage 型補完 ---
declare module '#imports' {
  import type { Storage } from 'unstorage'
  /**
   * Nitro の runtime storage を取得するヘルパ
   * 例: useStorage('assets:server').getItemRaw('sitemap.xml')
   */
  export function useStorage(base?: string): Storage
}
// Augment Nuxt auto-imports namespace so TS can resolve explicit imports across the app
declare module '#imports' {
  // Re-export standard composables
  export * from 'nuxt/app'
  export * from 'vue'
  export * from '#content'
  export { createError } from 'h3'
  export { definePageMeta } from 'nuxt/app'
}
