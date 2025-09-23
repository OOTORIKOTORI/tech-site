import type { AppConfigInput } from '@nuxt/schema'

declare module '@nuxt/schema' {
  interface AppConfigInput {
    site?: {
      brand?: {
        nameJa?: string
        nameEn?: string
        short?: string
      }
      tagline?: string
    }
  }
}

export {}
