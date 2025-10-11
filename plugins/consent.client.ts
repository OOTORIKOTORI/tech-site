// Lightweight consent mode receiver (scaffold before integrating a real CMP)
// - Activates only when runtime flag enableConsentMode is true
// - Initializes Consent Mode v2 defaults to 'denied' for ads and analytics
// - Listens for window.postMessage('cmp-consent', { ads, analytics }) to update
// - Designed so the postMessage sender can be swapped with a real CMP later

type ConsentVal = 'granted' | 'denied'
type ConsentPayload = { ads?: ConsentVal; analytics?: ConsentVal }
type ConsentUpdate = Partial<Record<'ad_storage' | 'analytics_storage', ConsentVal>>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __consentListenerInstalled?: boolean
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const pub = config.public as typeof config.public & {
    enableConsentMode?: boolean
    cmpRegionFilter?: string
  }

  // Guard: feature flag must be true
  if (!pub.enableConsentMode) {
    return
  }

  // Optional: region filter gating (EEA/UK/CH only)
  // Current placeholder: enable for all regions when flag is true.
  // When region detection is added, check pub.cmpRegionFilter and user geolocation.

  // Initialize dataLayer lazily to avoid CSP inline script
  if (process.client) {
    if (!window.dataLayer) window.dataLayer = []

    window.gtag =
      window.gtag ||
      ((...args: unknown[]) => {
        window.dataLayer!.push(args)
      })

    // Consent Mode v2 default to denied
    // Reference keys: ad_storage, analytics_storage
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
    })

    // Listen for synthetic consent events via postMessage

    const onMessage = (ev: MessageEvent<unknown>) => {
      if (!ev || typeof ev.data !== 'object' || ev.data === null) return
      const { type, payload } = ev.data as { type?: string; payload?: ConsentPayload }
      if (type !== 'cmp-consent') return
      const update: ConsentUpdate = {}
      if (payload?.ads) update.ad_storage = payload.ads
      if (payload?.analytics) update.analytics_storage = payload.analytics
      if (Object.keys(update).length) window.gtag?.('consent', 'update', update)
    }

    // Idempotent listener installation to play nice with HMR
    if (!window.__consentListenerInstalled) {
      window.addEventListener('message', onMessage)
      window.__consentListenerInstalled = true
    }
  }
})
