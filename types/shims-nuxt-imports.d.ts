// Augment Nuxt auto-imports namespace so TS can resolve explicit imports across the app
declare module '#imports' {
  // Re-export standard composables
  export * from 'nuxt/app'
  export * from 'vue'
  export * from '#content'
  export { createError } from 'h3'
  export { definePageMeta } from 'nuxt/app'
}
