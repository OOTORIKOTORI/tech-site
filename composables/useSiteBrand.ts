import { useAppConfig } from '#imports'

export type Brand = {
  nameJa?: string
  nameEn?: string
  short?: string
}

export function useSiteBrand(): { brand: Brand; display: string; tagline?: string } {
  const cfg = useAppConfig() as any
  const brand: Brand = (cfg?.site?.brand ?? {}) as Brand
  const display = brand?.short || 'Migaki Explorer'
  const tagline = cfg?.site?.tagline
  return { brand, display, tagline }
}
