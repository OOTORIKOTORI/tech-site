export default defineEventHandler(event => {
  if (process.env.ENABLE_ADS_DEBUG === '1') {
    setResponseHeader(event, 'X-Ads-Script', 'enabled')
  }
})
