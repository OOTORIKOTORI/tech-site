import { describe, it, expect } from 'vitest'
import { resolveBlogDoc } from '@/utils/resolveBlogDocByRoute'
import type { BlogDoc } from '@/utils/resolveBlogDocByRoute'

describe('resolveBlogDoc', () => {
  const docs: BlogDoc[] = [
    { _path: '/blog/hello-world', title: 'hello', body: 'body', _type: 'markdown' },
    { _path: '/blog/hello-world/', title: 'hello-slash', body: 'body', _type: 'markdown' },
    { _path: '/blog/Hello-World', title: 'hello-case', body: 'body', _type: 'markdown' },
    { _path: '/blog/empty', title: 'empty', body: '', _type: 'markdown' },
    { _path: '/blog/other', title: 'other', body: 'body', _type: 'markdown' },
    { _path: '/blog', title: 'blog-top', body: 'body', _type: 'markdown' },
  ]

  it('厳密一致: /blog/hello-world', () => {
    const doc = resolveBlogDoc('/blog/hello-world', docs)
    expect(doc?._path).toBe('/blog/hello-world')
  })
  it('末尾スラッシュ: /blog/hello-world/', () => {
    const doc = resolveBlogDoc('/blog/hello-world/', docs)
    expect(doc?._path).toBe('/blog/hello-world/')
  })
  it('大小混在: /blog/Hello-World', () => {
    const doc = resolveBlogDoc('/blog/Hello-World', docs)
    expect(doc?._path).toBe('/blog/Hello-World')
  })
  it('存在しない: /blog/notfound', () => {
    const doc = resolveBlogDoc('/blog/notfound', docs)
    expect(doc).toBeNull()
  })
  it('body無しはnull', () => {
    const doc = resolveBlogDoc('/blog/empty', docs)
    expect(doc).toBeNull()
  })
  it('最長一致: /blog', () => {
    const doc = resolveBlogDoc('/blog', docs)
    expect(doc?._path).toBe('/blog')
  })
})
