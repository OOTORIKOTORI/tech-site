import { useRoute, useRequestURL, computed, useAppConfig } from '#imports'
import { resolveSiteUrl } from './siteUrl'

type SiteConfig = { title?: string; description?: string; ogDefaultPath?: string }
type AppConfig = { site?: SiteConfig }
const useAppConfigTyped = useAppConfig as unknown as <T>() => T

export function useDefaultTitle() {
  const app = useAppConfigTyped<AppConfig>()
  return app.site?.title ?? 'KOTORI Lab — Tech Tools & Notes'
}

export function useDefaultDescription() {
  const app = useAppConfigTyped<AppConfig>()
  return app.site?.description ?? '便利ツールと実務ノウハウの技術サイト'
}

export function useOgDefaultPath() {
  const app = useAppConfigTyped<AppConfig>()
  return app.site?.ogDefaultPath ?? '/og-default.png'
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
