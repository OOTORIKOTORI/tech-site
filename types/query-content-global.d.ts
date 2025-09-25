// Global declaration for queryContent stub (tests inject) so TypeScript won't error
interface __QCBuilder<T> {
  only?(k: string[]): __QCBuilder<T>
  where?(c: Record<string, unknown>): __QCBuilder<T>
  sort?(s: Record<string, 1 | -1>): __QCBuilder<T>
  limit?(n: number): __QCBuilder<T>
  find?(): Promise<T[]>
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const queryContent: <T = unknown>(path?: string) => __QCBuilder<T>
