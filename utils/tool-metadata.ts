import type { ToolCategory, ToolId } from '~/types/blog'

export interface ToolMetadata {
  id: ToolId
  title: string
  description: string
  category: ToolCategory
  path: string
  audience?: string
  timeEstimate?: string
  inputOutput?: string
  isNew?: boolean
}

export const TOOL_CATEGORIES: Record<
  ToolCategory,
  { id: ToolCategory; name: string; description: string }
> = {
  time: {
    id: 'time',
    name: '時間・スケジューラ',
    description: 'Cron式やタイムスタンプの変換・検証ツール',
  },
  'auth-security': {
    id: 'auth-security',
    name: '認証・セキュリティ',
    description: 'JWT解析やセキュリティヘッダのチェックツール',
  },
  web: {
    id: 'web',
    name: 'Web/SEO',
    description: 'OGタグ、PWA、サイトマップなどWeb関連のチェックツール',
  },
  devops: {
    id: 'devops',
    name: 'DevOps/ログ',
    description: 'ログ解析やシステム監視に役立つツール',
  },
  format: {
    id: 'format',
    name: '形式変換・検証',
    description: 'JSON整形や正規表現テストなど形式処理ツール',
  },
  ai: {
    id: 'ai',
    name: 'AI/LLMツール',
    description: 'LLMトークン計算やプロンプトコスト見積もりツール',
  },
}

export const TOOLS: ToolMetadata[] = [
  // time
  {
    id: 'cron-jst',
    title: 'Cron JST',
    description:
      'サーバ運用や定時実行の確認に。crontab の式を JST/UTC で即座に検証、次回実行がひと目でわかる。',
    category: 'time',
    path: '/tools/cron-jst',
  },
  {
    id: 'timestamp',
    title: 'Epoch Timestamp Converter',
    description: 'Epoch ⇄ 日時（JST/UTC）を双方向変換。秒/ミリ秒は自動判定または手動指定。',
    category: 'time',
    path: '/tools/timestamp',
    audience: '開発・運用',
    timeEstimate: '~10秒',
    inputOutput: '入力: 1700000000 / 出力: JST/UTC',
    isNew: true,
  },

  // auth-security
  {
    id: 'jwt-decode',
    title: 'JWT Decode',
    description: '認証トークンの中身をローカルで確認。ペイロードを安全に可視化（秘密鍵は不要）。',
    category: 'auth-security',
    path: '/tools/jwt-decode',
  },
  {
    id: 'security-checker',
    title: 'Security Header Checker',
    description:
      'URLのHTTPレスポンスヘッダを取得し、セキュリティヘッダの有無と推奨値を判定します。',
    category: 'auth-security',
    path: '/tools/security-checker',
    audience: 'Web開発者・セキュリティ担当',
    timeEstimate: '~30秒',
    inputOutput: '入力: URL / 出力: ヘッダ検証結果',
    isNew: true,
  },

  // web
  {
    id: 'og-check',
    title: 'OGプレビュー確認',
    description: '共有時の画像/タイトルの状態と、最終URL・HTTPステータスを一発チェック。',
    category: 'web',
    path: '/tools/og-check',
  },
  {
    id: 'site-check',
    title: 'サイトマップ / robots チェッカー',
    description: '/sitemap.xml と /robots.txt をまとめて確認。掲載可否と到達性を素早く点検。',
    category: 'web',
    path: '/tools/site-check',
  },
  {
    id: 'pwa-checker',
    title: 'PWA Manifest Checker',
    description: 'URLからmanifest.jsonを取得し、必須フィールドや推奨設定を検証します。',
    category: 'web',
    path: '/tools/pwa-checker',
    audience: 'フロントエンド開発者',
    timeEstimate: '~30秒',
    inputOutput: '入力: URL / 出力: Manifest検証結果',
    isNew: true,
  },

  // devops
  {
    id: 'top-analyzer',
    title: 'Top Log Analyzer',
    description:
      'top ログから CPU / Mem / Load を時系列で把握できる可視化ツール（ブラウザ内のみで解析）',
    category: 'devops',
    path: '/tools/top-analyzer',
    audience: 'Linux/インフラ運用のSE/DevOps',
    timeEstimate: '1–3分',
    inputOutput: '入力: topログ / 出力: グラフ＋CSV(英/日)',
    isNew: true,
  },

  // format
  {
    id: 'json-formatter',
    title: 'JSON フォーマッタ',
    description: 'JSON をブラウザ内で整形／最小化して検証。コピー／ダウンロード対応。',
    category: 'format',
    path: '/tools/json-formatter',
    inputOutput: '入力: JSON 文字列 / 出力: 整形JSON',
  },
  {
    id: 'regex-tester',
    title: '正規表現テスター',
    description: 'パターンとフラグで一致箇所をテスト。簡易ハイライトとコピーに対応。',
    category: 'format',
    path: '/tools/regex-tester',
    inputOutput: '入力: テキスト / 出力: 一致リスト',
  },

  // ai
  {
    id: 'token-counter',
    title: 'LLM Token Counter & Cost Estimator',
    description: 'テキストのトークン数を計算し、主要LLMモデルごとの推定コストを表示します。',
    category: 'ai',
    path: '/tools/token-counter',
    audience: 'AI開発者・プロンプトエンジニア',
    timeEstimate: '~20秒',
    inputOutput: '入力: テキスト / 出力: トークン数＋コスト',
    isNew: true,
  },
]

/**
 * Get tools grouped by category
 */
export function getToolsByCategory(): Record<ToolCategory, ToolMetadata[]> {
  const grouped = {} as Record<ToolCategory, ToolMetadata[]>

  for (const category of Object.keys(TOOL_CATEGORIES) as ToolCategory[]) {
    grouped[category] = TOOLS.filter(tool => tool.category === category)
  }

  return grouped
}

/**
 * Get tool metadata by ID
 */
export function getToolById(id: ToolId): ToolMetadata | undefined {
  return TOOLS.find(tool => tool.id === id)
}
