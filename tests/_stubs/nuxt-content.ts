// Vitest stub for @nuxt/content runtime export
// Proxies queryContent to globalThis.queryContent set in each test
export function queryContent(path?: string) {
  const g = globalThis as unknown as { queryContent?: (p?: string) => any }
  if (typeof g.queryContent !== 'function') {
    throw new Error('globalThis.queryContent is not defined in tests')
  }
  return g.queryContent(path)
}
