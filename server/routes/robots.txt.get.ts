export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  let siteUrl: string = config.public?.siteUrl || ''
  if (siteUrl.endsWith('/')) siteUrl = siteUrl.slice(0, -1)
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return body
})
