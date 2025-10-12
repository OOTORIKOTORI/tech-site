export default defineEventHandler(() => {
  const { public: pub } = useRuntimeConfig()
  const enable = `${pub.enableAds ?? ''}`
  const client = `${pub.adsenseClient ?? ''}`
  return {
    enableAds: enable,
    adsenseClientMasked: client ? client.replace(/^(.{7}).+$/, '$1********') : '',
    importMetaDev: import.meta.dev === true,
  }
})
