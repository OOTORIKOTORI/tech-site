import { useHead, useServerHead } from '#imports'
import { siteUrl } from '@/utils/siteUrl'

export type BreadcrumbItem = { name: string; url: string }

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  const list = (items || []).map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: it.name,
    item: siteUrl(it.url),
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list,
  }
}

export function useBreadcrumbJsonLd(items: BreadcrumbItem[]): void {
  const ld = buildBreadcrumbJsonLd(items)
  const setHead = typeof useServerHead === 'function' ? useServerHead : useHead
  setHead(() => ({
    script: [{ type: 'application/ld+json', children: JSON.stringify(ld) }],
  }))
}
