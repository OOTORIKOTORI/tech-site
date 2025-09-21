import { afterAll } from 'vitest'
export {}

const originalWarn = console.warn
const originalWindowWarn: ((...args: unknown[]) => void) | null =
  typeof window !== 'undefined' && window?.console?.warn
    ? (window.console.warn as (...args: unknown[]) => void)
    : null

function shouldIgnoreWarn(args: unknown[]): boolean {
  const [msg] = args
  if (typeof msg !== 'string') return false
  if (/<Suspense>\s+is an experimental feature/i.test(msg)) return true
  if (/Suspense.+experimental/i.test(msg)) return true
  return false
}

console.warn = (...args: unknown[]) => {
  if (shouldIgnoreWarn(args)) return
  return (originalWarn as (...args: unknown[]) => void).apply(console, args)
}

if (typeof window !== 'undefined' && window?.console) {
  window.console.warn = (...args: unknown[]) => {
    if (shouldIgnoreWarn(args)) return
    if (originalWindowWarn) return originalWindowWarn.apply(window.console, args as [])
    return (originalWarn as (...args: unknown[]) => void).apply(window.console, args as [])
  }
}

afterAll(() => {
  console.warn = originalWarn
  if (typeof window !== 'undefined' && window?.console && originalWindowWarn) {
    window.console.warn = originalWindowWarn
  }
})
