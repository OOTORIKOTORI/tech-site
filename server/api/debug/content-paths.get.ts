import type { H3Event } from 'h3'
import { defineEventHandler, getQuery } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'

export default defineEventHandler(async event => {
  const { path } = getQuery(event)
  const reqPath = typeof path === 'string' ? path : undefined

  let hit = false
  let foundPath: string | undefined

  if (reqPath) {
    // Prefer serverQueryContent if available, otherwise fallback to queryCollection
    try {
      const mod = (await import('#content/server')) as {
        serverQueryContent?: (e: H3Event) => {
          where: (q: Record<string, unknown>) => {
            findOne: () => Promise<{ _path?: string } | null>
          }
        }
      }
      if (mod && typeof mod.serverQueryContent === 'function') {
        const doc = await mod.serverQueryContent(event).where({ _path: reqPath }).findOne()
        hit = !!doc
        foundPath = doc?._path
      } else {
        const all = await queryCollection(event, 'blog').select('path').all()
        const paths = Array.isArray(all)
          ? (all as Array<{ path?: string }>)
              .map(d => d.path)
              .filter((p): p is string => typeof p === 'string')
          : []
        hit = paths.includes(reqPath)
        foundPath = hit ? reqPath : undefined
      }
    } catch {
      const all = await queryCollection(event, 'blog').select('path').all()
      const paths = Array.isArray(all)
        ? (all as Array<{ path?: string }>)
            .map(d => d.path)
            .filter((p): p is string => typeof p === 'string')
        : []
      hit = paths.includes(reqPath)
      foundPath = hit ? reqPath : undefined
    }
  }

  return { hit, reqPath, _path: foundPath }
})
