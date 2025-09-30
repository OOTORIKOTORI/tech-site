import { defineEventHandler, getQuery, createError } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'

export default defineEventHandler(async event => {
  const { path } = getQuery(event) as { path?: string }
  if (!path || typeof path !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'path required' })
  }
  // path は '/blog/...' 形式
  const doc = await queryCollection(event, 'blog').path(path).first()
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }
  return doc
})
