// content.config.ts
import { defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  // 将来的にコレクション/スキーマを増やす予定がなくても
  // TypeScriptの型エラーを避けるために空オブジェクトを渡しておく
  collections: {},
})
