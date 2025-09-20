// Minimal #imports shim for tests. Implementations are provided on globalThis by each test.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any

export const useRoute: AnyFn = (...args) => g.useRoute?.(...args)
export const useAsyncData: AnyFn = (...args) => g.useAsyncData?.(...args)
export const createError: AnyFn = (...args) => g.createError?.(...args)
export const useHead: AnyFn = (...args) => g.useHead?.(...args)
export const useSeoMeta: AnyFn = (...args) => g.useSeoMeta?.(...args)
export const computed: AnyFn = (...args) => g.computed?.(...args)
export const useAppConfig: AnyFn = (...args) => g.useAppConfig?.(...args)
export const useRequestURL: AnyFn = (...args) => g.useRequestURL?.(...args)

// Expose queryContent via global to match page's access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).queryContent = (globalThis as any).queryContent
