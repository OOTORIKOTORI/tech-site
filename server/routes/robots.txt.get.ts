type PublicConfig = { siteOrigin?: string; siteUrl?: string }
export default defineEventHandler(event => {
  const config = useRuntimeConfig() as { public: PublicConfig }
  let siteUrl: string = String(config.public?.siteOrigin || config.public?.siteUrl || '')
  if (siteUrl.endsWith('/')) siteUrl = siteUrl.slice(0, -1)
  const body = ['User-agent: *', 'Allow: /', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return body
})
