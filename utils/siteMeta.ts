import { useRuntimeConfig, useRoute, useRequestURL, computed } from '#imports'

export const defaultTitle = 'KOTORI Lab — Tech Tools & Notes'
export const defaultDescription = '便利ツールと実務ノウハウの技術サイト'

export const ogDefaultPath = '/og-default.png'

export function useAbsoluteBase() {
  const config = useRuntimeConfig()
  const base = (config.public.siteUrl || '').replace(/\/$/, '')
  const reqUrl = useRequestURL()
  const origin = reqUrl?.origin && reqUrl.origin !== 'null' ? reqUrl.origin : base
  return origin
}

export function useCanonicalUrl() {
  const origin = useAbsoluteBase()
  const route = useRoute()
  return computed(() => origin + route.fullPath)
}

export function absoluteUrl(pathOrUrl: string, base?: string) {
  const origin = (base || useAbsoluteBase()).replace(/\/$/, '')
  try {
    // If already absolute
    // eslint-disable-next-line no-new
    new URL(pathOrUrl)
    return pathOrUrl
  } catch {
    return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
  }
}
