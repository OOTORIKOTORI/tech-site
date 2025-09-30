// Minimal shim for @nuxt/content server APIs used in this project
declare module '#content/server' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function serverQueryContent(event?: any): any
}
