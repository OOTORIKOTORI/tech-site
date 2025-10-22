type ConsentState = 'granted' | 'denied'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __consentModeDefaultApplied?: boolean
  }
}

export default defineNuxtPlugin({
  name: 'consent-mode-v2',
  enforce: 'pre',
  setup() {
    if (process.server) return

    const win = window as Window & {
      dataLayer: unknown[]
      gtag: (...args: unknown[]) => void
      __consentModeDefaultApplied?: boolean
    }

    win.dataLayer = win.dataLayer || []
    if (typeof win.gtag !== 'function') {
      // Minimal gtag stub so Consent Mode calls succeed before gtag.js loads
      // Use rest parameters instead of `arguments` to satisfy ESLint prefer-rest-params
      win.gtag = function gtag(...args: unknown[]) {
        (win.dataLayer as unknown[]).push(args)
      }
    }

    if (!win.__consentModeDefaultApplied) {
      const denied: ConsentState = 'denied'
      win.gtag('consent', 'default', {
        ad_storage: denied,
        analytics_storage: denied,
        ad_user_data: denied,
        ad_personalization: denied,
      })
      win.__consentModeDefaultApplied = true
    }
  },
})
