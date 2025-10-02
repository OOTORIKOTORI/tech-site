export default defineAppConfig({
  site: {
    title: '磨きエクスプローラー — Tech Tools & Notes',
    description: '便利ツールと実務ノウハウの技術サイト',
    ogDefaultPath: '/og-default.png',
    brand: {
      nameJa: '磨きエクスプローラー',
      nameEn: 'Migaki Explorer',
      short: 'Migaki Explorer',
    },
    tagline: 'Tech Tools & Notes — 実務のための小さな道具とメモ。',
  },
  // shared glossary for inline term tooltips
  glossary: {
    JWT: '自己完結型トークン。header.payload.signature の3区から成る。',
    JWS: '署名付きトークン。改ざん検知が目的。',
    JWE: '暗号化トークン。秘匿が目的。',
    HS256: 'HMAC+SHA-256。共有鍵方式。',
    RS256: 'RSA+SHA-256。公開鍵方式。',
  },
})
