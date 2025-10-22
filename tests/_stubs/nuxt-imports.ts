// Minimal #imports shim for tests. Implementations are provided on globalThis by each test.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any

export const useRoute: AnyFn = (...args) => g.useRoute?.(...args)
export const useAsyncData: AnyFn = (...args) => g.useAsyncData?.(...args)
export const useFetch: AnyFn = async (url: string) => {
  // When testing our blog v2 list page, synthesize API from queryContent stub
  if (typeof url === 'string' && url.includes('/api/blogv2/list')) {
    const compute = async () => {
      try {
        const q = g.queryContent?.()
        const all =
          (await q?.only?.(['_path', 'title', 'description', 'date', 'updated'])?.find?.()) ?? []
        const blogOnly = all.filter(
          (p: any) =>
            typeof p?._path === 'string' && (p._path === '/blog' || p._path.startsWith('/blog/'))
        )
        const fallback = blogOnly.length === 0
        const items = (fallback ? all.slice(0, 10) : blogOnly).sort(
          (a: any, b: any) =>
            new Date(b?.date ?? b?.updated ?? 0).getTime() -
            new Date(a?.date ?? a?.updated ?? 0).getTime()
        )
        return { count: items.length, items, debug: { fallback } }
      } catch {
        return { count: 0, items: [], debug: { fallback: true } }
      }
    }
    // Return a ref-like object so Vue template auto-unwrapping works in tests
    const result = await compute()
    return { data: { value: result, __v_isRef: true } }
  }
  // Fallback: approximate useFetch via useAsyncData if available
  if (typeof g.useAsyncData === 'function') {
    return g.useAsyncData(url, async () => (g.$fetch ? g.$fetch(url) : undefined))
  }
  return { data: { value: undefined } }
}
export const createError: AnyFn = (...args) => g.createError?.(...args)
export const useHead: AnyFn = (...args) => g.useHead?.(...args)
export const useSeoMeta: AnyFn = (...args) => g.useSeoMeta?.(...args)
export const computed: AnyFn = (...args) => g.computed?.(...args)
export const useAppConfig: AnyFn = (...args) => g.useAppConfig?.(...args)
export const useRequestURL: AnyFn = (...args) => g.useRequestURL?.(...args)
export const useRuntimeConfig: AnyFn = () =>
  g.useRuntimeConfig ? g.useRuntimeConfig() : { public: {} }
export const useServerHead: AnyFn = (...args) =>
  g.useServerHead ? g.useServerHead(...args) : g.useHead?.(...args)
export const useStorage: AnyFn = (...args) => g.useStorage?.(...args)

export const definePageMeta: AnyFn = (...args) => g.definePageMeta?.(...args)

// Expose queryContent via global to match page's access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).queryContent = (globalThis as any).queryContent

// Provide named export so pages can import from '#imports'
export const queryContent: AnyFn = (...args) => g.queryContent?.(...args)
