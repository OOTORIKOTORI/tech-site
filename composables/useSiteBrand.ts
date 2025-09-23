import { useAppConfig } from '#imports'

type Brand = { nameJa?: string; nameEn?: string; short?: string }

export function useSiteBrand(): { brand: Brand; display: string; tagline: string } {
  const cfg = useAppConfig()
  const brand: Brand = {
    nameJa: cfg.site?.brand?.nameJa ?? '磨きエクスプローラー',
    nameEn: cfg.site?.brand?.nameEn ?? 'Migaki Explorer',
    short: cfg.site?.brand?.short ?? 'Migaki Explorer',
  }
  const display = brand.short ?? 'Migaki Explorer'
  const tagline = cfg.site?.tagline ?? 'Tech Tools & Notes — 実務のための小さな道具とメモ。'
  return { brand, display, tagline }
}
