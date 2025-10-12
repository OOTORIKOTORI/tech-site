export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('render:html', (ctx, { event }) => {
    const has = ctx.head?.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=')
    if (event) {
      setHeader(event, 'x-ads-script', has ? '1' : '0')
    }
  })
})
