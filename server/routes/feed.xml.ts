import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const feedPath = join(here, '../../public/feed.xml')

export default defineEventHandler(async e => {
  setHeader(e, 'Content-Type', 'application/xml; charset=utf-8')
  return await readFile(feedPath, 'utf8')
})
