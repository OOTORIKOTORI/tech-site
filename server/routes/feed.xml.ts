import { useStorage } from '#imports'
export default defineEventHandler(async e => {
  setHeader(e, 'Content-Type', 'application/xml; charset=utf-8')
  const storage = useStorage('assets:server')
  const buf = await storage.getItemRaw('feed.xml')
  return buf ? buf.toString('utf8') : ''
})
