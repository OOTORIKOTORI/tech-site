export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('render:html', (ctx, { event }) => {
    if (process.env.ENABLE_ADS_DEBUG === '1') {
      const needle = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='
      const inHead = (ctx.head || '').includes(needle)
      const inHtml = (ctx.body || '').includes(needle)
      if (event) {
        setHeader(event, 'x-ads-script', inHead || inHtml ? '1' : '0')
      }
    }
  })
})
