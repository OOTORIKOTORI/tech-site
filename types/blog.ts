/**
 * Blog content types and visibility configuration
 */

export type ContentType = 'primer' | 'guide' | 'reference' | 'news'
export type ContentVisibility = 'primer' | 'archive' | 'hidden'
export type RobotsDirective = 'index' | 'noindex'

/**
 * Tool category for organizing tools page
 */
export type ToolCategory =
  | 'time' // 時間・スケジューラ
  | 'auth-security' // 認証・セキュリティ
  | 'web' // Web/SEO
  | 'devops' // DevOps/ログ
  | 'format' // 形式変換・検証
  | 'ai' // AI/LLMツール

/**
 * Tool ID for referencing specific tools
 */
export type ToolId =
  | 'cron-jst'
  | 'timestamp'
  | 'jwt-decode'
  | 'og-check'
  | 'site-check'
  | 'top-analyzer'
  | 'json-formatter'
  | 'regex-tester'
  | 'token-counter'
  | 'pwa-checker'
  | 'security-checker'

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
  tool?: ToolId
  category?: ToolCategory
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
