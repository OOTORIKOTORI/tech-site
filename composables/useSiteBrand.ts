import { useAppConfig } from '#imports'

type Brand = { nameJa: string; nameEn: string; short: string }

export function useSiteBrand(): { brand: Brand; display: string; tagline: string } {
  const raw = (useAppConfig() ?? {}) as {
    site?: { brand?: Partial<Brand>; tagline?: string }
  }
  const brand: Brand = {
    nameJa: raw.site?.brand?.nameJa ?? '磨きエクスプローラー',
    nameEn: raw.site?.brand?.nameEn ?? 'Migaki Explorer',
    short: raw.site?.brand?.short ?? 'Migaki Explorer',
  }
  const display = brand.short
  const tagline = raw.site?.tagline ?? 'Tech Tools & Notes — 実務のための小さな道具とメモ。'
  return { brand, display, tagline }
}
