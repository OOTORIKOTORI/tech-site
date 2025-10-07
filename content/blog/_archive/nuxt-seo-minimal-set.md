---
title: 'Nuxt + @nuxt/contentで"土台SEO"を最短構築する最小セット'
description: 'canonical/JSON-LD/robots/sitemap/feedを最小のコードで。プレビューnoindexとCIチェックまで。'
slug: 'nuxt-seo-minimal-set'
date: '2025-09-23'
published: false
robots: "noindex,follow"
tags:
  - Nuxt
  - SEO
  - JSON-LD
  - CI
  - internal
  - archived
draft: false
---: 'Nuxt + @nuxt/contentで“土台SEO”を最短構築する最小セット'
description: 'canonical/JSON-LD/robots/sitemap/feedを最小のコードで。プレビューnoindexとCIチェックまで。'
slug: 'nuxt-seo-minimal-set'
date: '2025-09-23'
tags: ['Nuxt', 'SEO', 'JSON-LD', 'CI']
published: true
draft: false
---

> **この記事は何？**
> Nuxt でブログやドキュメントを作るときに、検索結果や SNS で“変な表示にならないようにする”
> **最低限の土台**を 30〜60 分で整えるガイドです。難しいチューニングはしません。

**誰に向いてる？**

- Nuxt でサイトを作っている / 作る予定がある
- 「専門の SEO 担当はいないけど、基本はちゃんとしたい」
- 技術ブログ・製品ブログ・個人サイトなど、小〜中規模のサイト運営

**これをやると何が良くなる？（効果のイメージ）**

- 検索エンジンに「この URL が正解だよ」が伝わる → 重複 URL で評価が分散しにくい（= `canonical`）
- 記事の“意味”を機械に伝えられる → タイトル/説明/更新日が安定（= `JSON-LD`）
- プレビュー環境が検索に出ない → テスト中にインデックスされる事故を防止（= `robots` の `noindex`）
- 新しい記事を見つけてもらいやすくなる（= `sitemap.xml`）
- 読者が購読アプリで新着を追える（= `feed.xml`）
- さらに**本番 URL を一元管理**して、CI で自動チェックできる（運用がラク）

**用語ミニ辞典（30 秒で分かる）**

- `ORIGIN` … サイトの土台 URL。例：`https://migakiexplorer.jp`
- `canonical` … 「このページの“正解 URL”はこれ」。`?utm=…`付きなどの別 URL をまとめる“名札”
- `JSON-LD` … ページの意味を検索エンジン向けに機械可読で書く“付箋”。記事タイトル/説明/更新日/発行元など
- `robots.txt` … サイト全体へのルール表。「ここは見ても OK / ここはダメ」
- `sitemap.xml` … クローラに渡す“地図”。どの URL があるか一覧で伝える
- `feed.xml` … 新着の“お知らせ”。RSS/Atom のどちらかで OK

**読む前の前提**

- Nuxt 3/4 と `@nuxt/content` を利用
- `.env` と `plugins/` にファイルを追加できる（コピペで OK）

> まず結果だけ見たい人は → 下の「最短手順（5 分版）」へジャンプ

### このガイドで整える 5 点

1. **canonical** … 各ページの正規 URL を明示
2. **JSON-LD** … Organization / BlogPosting / BreadcrumbList
3. **robots.txt** … クロール方針（プレビューは noindex）
4. **sitemap.xml** … クロール対象の一覧
5. **feed.xml** … 更新通知（RSS/Atom のどちらか）

---

## 最短手順（5 分版）

1. `.env` に `NUXT_PUBLIC_SITE_ORIGIN=https://example.com` を入れる。
2. 下記プラグイン（A/B/D）を `plugins/` に追加して有効化。
3. 記事ページ（`pages/blog/[slug].vue`）に BlogPosting の JSON-LD（C）を追加。
4. `public/robots.txt` を本番用に置く。プレビューは `X-Robots-Tag: noindex, nofollow` をヘッダで送る。
5. `sitemap.xml` / `feed.xml` を生成する簡単スクリプトを用意。CI で `postbuild --check-only` を実行。

> 詳細は以下のスニペットをコピペで OK。最後に**検証方法**も書いてあります。

---

## コピペでいけるスニペット

> 前提: **Nuxt 3/4 + @nuxt/content**。`siteOrigin` は `useRuntimeConfig().public.siteOrigin` から参照。

### A) canonical（全ページ共通）

```ts
// plugins/canonical.client.ts
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const {
    public: { siteOrigin },
  } = useRuntimeConfig()
  useHead(() => {
    // 正規URLは通常クエリなしにする（tracking等を排除）
    const href = new URL(route.path || '/', siteOrigin).toString()
    return { link: [{ rel: 'canonical', href }] }
  })
})
```

### B) Organization（サイト全体）

```ts
// plugins/schema-org.client.ts
export default defineNuxtPlugin(() => {
  const {
    public: { siteOrigin },
  } = useRuntimeConfig()
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '磨きエクスプローラー（Migaki Explorer）',
    url: siteOrigin,
    logo: `${siteOrigin}/logo.png`, // 絶対URL
  }
  useHead({
    script: [{ type: 'application/ld+json', children: JSON.stringify(org) }],
  })
})
```

### C) BlogPosting（各記事ページ）

`pages/blog/[slug].vue` で記事を取得して JSON-LD を生成。

```vue
<script setup lang="ts">
const route = useRoute()
const {
  public: { siteOrigin },
} = useRuntimeConfig()
const { data: doc } = await useAsyncData('post', () =>
  queryContent(`/blog/${route.params.slug}`).findOne()
)

const url = new URL(route.path || '/', siteOrigin).toString()
const schema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: doc.value?.title,
  description: doc.value?.description,
  url: url,
  mainEntityOfPage: url,
  datePublished: doc.value?.date,
  dateModified: doc.value?.updatedAt ?? doc.value?.date,
  publisher: {
    '@type': 'Organization',
    name: '磨きエクスプローラー（Migaki Explorer）',
    logo: { '@type': 'ImageObject', url: `${siteOrigin}/logo.png` },
  },
}))
useHead({ script: [{ type: 'application/ld+json', children: JSON.stringify(schema.value) }] })
</script>

<template>
  <!-- 現在のslugに対応する記事を表示（または <ContentDoc /> でも可） -->
  <ContentDoc :path="`/blog/${String(route.params.slug)}`" :surround="false" />
</template>
```

### D) BreadcrumbList（/blog と /blog/[slug]）

```ts
// plugins/breadcrumbs.client.ts
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const {
    public: { siteOrigin },
  } = useRuntimeConfig()

  const items = computed(() => {
    const base = [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteOrigin }]
    if (route.path.startsWith('/blog')) {
      base.push({ '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteOrigin}/blog` })
      if (route.params.slug) {
        base.push({
          '@type': 'ListItem',
          position: 3,
          // 本当は記事タイトルが理想だが、汎用プラグインではslug名でOK
          name: String(route.params.slug),
          item: `${siteOrigin}${route.path}`,
        })
      }
    }
    return base
  })

  const schema = computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.value,
  }))
  useHead({ script: [{ type: 'application/ld+json', children: JSON.stringify(schema.value) }] })
})
```

### E) robots.txt（本番とプレビューを分ける）

- **本番**（例：`public/robots.txt`）

```text
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
```

- **プレビュー（\*.vercel.app）** はレスポンスヘッダで `X-Robots-Tag: noindex, nofollow` を付与。

### F) sitemap.xml / feed.xml（最小で OK）

- `@nuxt/content` のルートから URL を作り、`public/sitemap.xml` と `public/feed.xml` を吐く小スクリプトで十分。
- **CI** では `postbuild --check-only` で **ORIGIN 一致**（`https://...` で始まり、期待ホストか）を検査。

---

## 検証（これが通れば OK）

- ページ HTML の `<head>` に **canonical** が出ている（クエリなし）。
- JSON-LD（`Organization` / `BlogPosting` / `BreadcrumbList`）が **検証ツール**でエラーなし。
- 本番 `robots.txt` に `Sitemap:` が出る。プレビューは `noindex` ヘッダ。
- `sitemap.xml` / `feed.xml` の URL が **本番 ORIGIN** で始まる。
- CI で `postbuild --check-only` / `smoke:og` / `LHCI`（Accessibility 95 以上）が通る。

## よくある落とし穴

- canonical を `fullPath` で作って **クエリ付き**にしてしまう。→ **`route.path`** を使う。
- JSON-LD の `logo` が相対パス。→ **絶対 URL**（`https://...`）に。
- プレビュー環境の **`noindex` 付け忘れ**。→ ホスティング設定 or ミドルウェアでヘッダ強制。

## FAQ（簡易）

- **Q. 画像の `width/height` は必須？**
  A. `Organization.logo` は URL だけでも検証は通ることが多い。画像のメタを持てるなら付与推奨。
- **Q. feed は RSS と Atom どっち？**
  A. 好みで OK。既存クライアント互換で **RSS** を選ぶケースが多い。
- **Q. まず何から？**
  A. ORIGIN 一元化 →canonical→Organization→BlogPosting→Breadcrumb→robots→sitemap/feed→CI の順が最短。

## まとめ

“土台 SEO”は**足し算より引き算**。まずは **canonical / JSON-LD / robots / sitemap / feed** の 5 点を揃え、**ORIGIN 一元化 + CI 検査**で“壊れない基盤”にするのが近道です。

## 関連リンク

- 内部: [ブログ一覧](/blog)
- 外部: [Nuxt Content 公式ドキュメント](https://content.nuxt.com/)
