declare module 'nitro/app' {
  export function useNitroApp(): { log?: { info?: (arg: any) => void } } | undefined
}
