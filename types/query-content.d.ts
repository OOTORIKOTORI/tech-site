// Minimal shim for auto-imported queryContent (Nuxt Content)
interface _QueryContentBuilder<T> {
  only(keys: string[]): _QueryContentBuilder<T>
  where(cond: Record<string, unknown>): _QueryContentBuilder<T>
  sort(s: Record<string, 1 | -1>): _QueryContentBuilder<T>
  limit(n: number): _QueryContentBuilder<T>
  find(): Promise<T[]>
  findOne(id?: string): Promise<T | null>
}
// Allow global usage without import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function queryContent<T = unknown>(path?: string): _QueryContentBuilder<T>

// Allow explicit import from Nuxt's auto-imports namespace
declare module '#imports' {
  export function queryContent<T = unknown>(path?: string): _QueryContentBuilder<T>
}
