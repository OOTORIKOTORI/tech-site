import { readFile } from 'node:fs/promises'
export default defineEventHandler(async e => {
  setHeader(e, 'Content-Type', 'application/xml; charset=utf-8')
  return await readFile('./public/feed.xml', 'utf8')
})
