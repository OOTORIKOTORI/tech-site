/**
 * Blog content types and visibility configuration
 */

export type ContentType = 'primer' | 'guide' | 'reference' | 'news'
export type ContentVisibility = 'primer' | 'archive' | 'hidden'
export type RobotsDirective = 'index' | 'noindex'

export interface BlogFrontmatter {
  title: string
  description: string
  date: string
  tags?: string[]
  audience?: string | string[]
  published?: boolean
  draft?: boolean

  // Tools-First extension
  type?: ContentType
  tool?: string
  visibility?: ContentVisibility
  robots?: RobotsDirective

  // Legacy fields (optional)
  benefits?: string
  for?: string
}

export interface BlogDocument extends BlogFrontmatter {
  _path: string
  body?: unknown
}
