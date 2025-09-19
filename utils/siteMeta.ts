import { useRoute, useRequestURL, computed, useAppConfig } from '#imports'
import { resolveSiteUrl } from './siteUrl'

export function useDefaultTitle() {
  const app = useAppConfig() as any
  return app.site?.title || 'KOTORI Lab — Tech Tools & Notes'
}

export function useDefaultDescription() {
  const app = useAppConfig() as any
  return app.site?.description || '便利ツールと実務ノウハウの技術サイト'
}

export function useOgDefaultPath() {
  const app = useAppConfig() as any
  return app.site?.ogDefaultPath || '/og-default.png'
}

export function useAbsoluteBase() {
  const reqUrl = useRequestURL()
  const fromReq = reqUrl?.origin && reqUrl.origin !== 'null' ? reqUrl.origin : ''
  return fromReq || resolveSiteUrl()
}

export function useCanonicalUrl() {
  const origin = useAbsoluteBase()
  const route = useRoute()
  return computed(() => origin + route.fullPath)
}

export function absoluteUrl(pathOrUrl: string, base?: string) {
  const origin = (base || useAbsoluteBase()).replace(/\/$/, '')
  try {
    // already absolute
    // eslint-disable-next-line no-new
    new URL(pathOrUrl)
    return pathOrUrl
  } catch {
    return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
  }
}
