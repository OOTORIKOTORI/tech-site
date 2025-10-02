※詳細ページの取得は `queryContent(exactPath).findOne()` か `where({_path})` のいずれか一法のみ／`find`→ 手動 filter は禁止
詳細ページは `queryContent(exactPath).findOne()` を使用（`find`→ 手動 filter 禁止）

## ブログ詳細の選択ロジック（正準）

- `_path` 完全一致・本文なしは 404（白紙回避）

補足（現状実装・collections 移行の運用メモ）:

- doc.body は AST（構造化ツリー）であり、文字列 HTML ではない。テンプレートで v-html に直接渡さないこと。描画は `<ContentRenderer :value="doc" />` を使うか、サーバー側で `renderContent` により HTML 化して返す。
- 選択ロジックは API 経由に一本化中（`/api/blogv2/doc?path=/blog/<slug>`）。collections 環境では `path` を一次キーとして厳密一致させる。
- SSR 時の相対 URL に注意。`ofetch` の `$fetch` に相対 URL を渡すと「Only absolute URLs are supported」で 500 になり得る。Nuxt グローバル `$fetch` / `useFetch` を使うか、`useRequestURL().origin`（または `useRuntimeConfig().public.siteOrigin`）で絶対 URL を組み立てる。

- ルート: `pages/blog/[...slug].vue`。受け取った `slug` 配列を `'/'` で結合し、**先頭に `/blog/` を必ず付与**して `_path` 候補を生成（例：`/blog/hello-world`）。
  ...
- **禁止**: `$regex` / `$exists` による曖昧選択。**許可**: 候補配列 → `queryContent('/blog')` で取得 → `array.filter(x => x._path === exactPath)` の**手動厳密一致**。ヒット 0 件なら 404（白紙は不可）。
- `body` 不在のレコードは描画しない（白紙対策）。
  ※body 不在は 404 扱いで白紙を避ける（暫定運用）。
- dev では `console.debug` で `candidates / hits / chosen` を表示する（運用ログの粒度指針）。

## ページメタの安全策

- `definePageMeta` は 1 回だけ。**await を含めない**（ビルド時 500 の回避）。失敗時はデフォルト値で回復。

## Blog v2（実験 API）の SELECT 安全化（/api/blogv2/list）

重要（強調）: `/api/blogv2/list` は **`id` と `path` のみ**を SELECT。取得失敗時も **200/空配列にフォールバック**（暫定運用）。仕様に明記済み。

- `blog` テーブルは拡張列 OK。`docs` は **必ず `id`/`path` のみ**に限定して SELECT（欠損列で 500 にしない）。
- 取得失敗時は 200 でフォールバック（空配列）を返す暫定運用。
- 返却スキーマは `{id,path}` 固定・200 フォールバックを厳守（再掲）。
- dev 検証用ダンプ: `__nuxt_content/blog/sql_dump.txt` / `__nuxt_content/docs/sql_dump.txt` 参照手順を明記（**本番リンク禁止**）。

## 表示条件の“落とすルール”の正準化

- “落とす条件だけ厳格” = `draft !== true && published !== false` を再掲（一覧/詳細とも二重フィルタ禁止、取得系 1 経路）。

## テスト方針

- 単体/統合:
  - `/_path` 厳密一致：既存記事 → 200、未知スラッグ → 404。
  - frontmatter の `'true'/'false'`（**string**）を含む判定のユニット/E2E。
- CI での通し順序は既定に従う（typecheck → lint → test → build → postbuild --check-only → smoke:og → LHCI）。

## ブログ追加手順（運用）

## Troubleshooting: /blog が "No posts yet" のとき

## Troubleshooting: /blog が "No posts yet" のとき

1. 配置: Markdown が `content/blog/*.md` に存在するか（パス/拡張子繋がり含め再確認）。
2. Frontmatter: `draft: false` か `draft` 未指定。`published: true` または `published` 未指定。例:

3. 配置: Markdown が `content/blog/*.md` に存在するか（パス/拡張子繋がり含め再確認）。
4. Frontmatter: `draft: false` か `draft` 未指定。`published: true` または `published` 未指定。例:
5. 一覧クエリ条件: 下書き除外 & 公開判定。
6. 詳細ページ: `_path` 厳密一致の手動選択ロジックで取得。`body` 不在レコードは描画しない（白紙防止）。
7. dev では candidates/hits/chosen を console.debug で出力。
8. frontmatter の `'true'/'false'`（string）も判定テスト対象。

### /blog 表示安定化（最短ルート方針）

### /blog 表示安定化（最短ルート方針）

### Troubleshooting: /blog 詳細（補足・最小）

`doc.body` は AST であり、テンプレートでは `<ContentRenderer :value="doc" />` を使用する。API レイヤで HTML にする場合は `renderContent` を使う。F5 リロードで 500 になる場合は SSR で ofetch の相対 URL が原因となり得るため、Nuxt の `$fetch`/`useFetch` を使うか `useRequestURL().origin` などで絶対 URL を渡す。

# プロジェクト仕様書 - 磨きエクスプローラー（Migaki Explorer）

## 📋 プロジェクト概要

### プロジェクト名

**磨きエクスプローラー（Migaki Explorer）** - 開発者向けツールサイト

### サイト概要

本サイトは「便利ツール＋技術ブログ」の開発者向け情報サイトです。
ツールはローカル完結（ブラウザ/Node 内）と安全性を重視し、記事は実務志向の短文ノートを配信します。
公開ドメイン（本番 ORIGIN）: https://migakiexplorer.jp

---

### ビジネスモデル

- 当面はディスプレイ広告中心。将来はスポンサー/アフィ/寄付等を検討。

---

### コンテンツ方針

- ツール: 実務で“すぐ役立つ”小粒機能を継続追加。共有リンク/SEO/a11y を必須要件化。
- ブログ: 週 1〜2 本を目標。検索意図に沿った構成（問題 → 解法 → 実例 → 落とし穴 → チェックリスト）。

---

### 運用/品質

- CI でテスト必須、PR レビュー（単独開発でもセルフレビュー手順を記載）。
- SEO ベースライン: Title/Description/OG/構造化データ、内部リンク、更新頻度。
- a11y: コントラスト/キーボード操作/aria/ラベル。
- 解析: ページビュー/コンバージョン（広告クリック）収集の方針（匿名集計）。

- Vercel での CD（自動デプロイ）を採用し、`NUXT_PUBLIC_SITE_ORIGIN` を canonical / og:url / robots / sitemap / RSS の基点に統一（例: https://migakiexplorer.jp）。
- 生成物は `robots.txt` / `sitemap.xml` / `feed.xml` に表記統一。postbuild（`scripts/gen-meta.mjs`）で生成し、`--check-only` でホスト一致を検証（ホスト検証専用）。

---

### 法務/ポリシー（骨子）

- プライバシーポリシー/クッキーポリシー/広告に関する記載（例: 第三者配信の Cookie 使用）を別ページに整備予定。
- ads.txt の配置（後日導入時）。具体的な広告コードは本仕様からは除外し、運用手順のみ記載。

---

### ナビゲーション / ページ

- ヘッダ: **Home / Tools / Blog**（現状）。
- フッタ: **法務導線（/privacy, /terms, /ads）** を配置。
- トップ `/`: ヒーロー＋ CTA（`/tools/cron-jst`, `/blog`）/ 最新 3 件を「Latest posts」で表示
- ブログ `/blog`: タイトル/日付（YYYY-MM-DD）/説明/リンク（0 件時は "No posts yet"）。カードに a11y ラベル付与。
- ブログ詳細 `/blog/[slug]`: 本文＋ SEO メタ（title/description/canonical/og:url）
- ツール: `/tools/cron-jst`, `/tools/jwt-decode`

- （実装済み）ヘッダ最小ナビ＋ Skip リンク。ブログ一覧カードは日付 `YYYY-MM-DD` と a11y ラベルを付与。

### 主要機能

- **JWT Decoder**: JSON Web Token のデコードツール（パス: `/tools/jwt-decode`）
- **Cron JST 予測**: crontab 形式のスケジュールから日本時間での次回実行時刻を予測（パス: `/tools/cron-jst`）

---

## 🚀 クイックスタート

1. リポジトリをクローンします。
   ```bash
   git clone https://github.com/OOTORIKOTORI/tech-site.git
   cd tech-site
   ```
2. 依存関係をインストールします。
   ```bash
   pnpm install
   ```
3. 開発サーバーを起動します。
   ```bash
   pnpm dev
   ```

## ⚙️ 主要設定 / 実装

- `nuxt.config.ts`: Nuxt 設定（`@nuxt/content`, `@nuxtjs/tailwindcss`）。`routeRules` で `/api/og/**` に `Cache-Control: no-store`。
- `utils/siteUrl.ts` / `utils/siteMeta.ts`: 絶対 URL 化（canonical / og:url など）。
- `server/middleware/noindex-preview.ts`: host が `*.vercel.app` の場合に `X-Robots-Tag: noindex, nofollow` を付与。
- `scripts/gen-meta.mjs`: Postbuild で `public/robots.txt` / `public/sitemap.xml` / `public/feed.xml` を生成。`--check-only` でホスト一致を検証（生成物のドメインが `NUXT_PUBLIC_SITE_ORIGIN` と一致することを確認）。
- `server/api/og/[slug].png.ts`: 既定は 302 で `/og-default.png` にフォールバック（no-store / X-OG-Fallback）。`ENABLE_DYNAMIC_OG=1` で軽量 PNG を動的生成（成功時 200、失敗時は即 302）。
- Cron 仕様: `utils/cron.ts` に実装。`dowDomMode` と `'*'` の解釈（OR=unrestricted / AND=always-true）。
- Auto-reload: `configVersion` / `settingsUpdatedAt` 変化 → 次 tick（10s）で再読込。
- dev 安定メモ:
  - `package.json` に `"imports": { "#content/server": "@nuxt/content/dist/runtime/server/index.mjs" }` を設定
  - `nuxt.config.ts` の `nitro.prerender.ignore` で `/blog/**` `/api/**` を prerender 対象外（dev 向けの明示メモ）

### サイト設定 / ブランド名（一元化）

- 定義場所: `app.config.ts`
  - `site.brand.nameJa`: 正式名（例: `磨きエクスプローラー`）
  - `site.brand.nameEn`: 英語名（例: `Migaki Explorer`）
  - `site.brand.short`: 短縮名/サイト名（`<title>` デフォルト、`og:site_name` に使用）
  - `site.tagline`: サイトの短い説明（ヒーロー下のコピー等）
- 参照先のルール
  - `<title>` と `titleTemplate`: `brand.short` を使用（`title ? `${title} | ${brand.short}` : brand.short`）
  - OGP: `og:site_name` は `brand.short`
  - JSON-LD: `Organization.name` および `BlogPosting.publisher.name` は `brand.short`
  - ロゴ: `/logo.png` の `alt` は `'Migaki Explorer'` を推奨（i18n のない単一ブランド表記）
- 実装補助
  - `composables/useSiteBrand.ts`: `brand` / `display`（=short）/ `tagline` を返すコンポーザブル
  - Home/フッタ/メタは当該コンポーザブル経由で参照
- （任意）Web App Manifest の `name`/`short_name` はブランド準拠（『磨きエクスプローラー（Migaki Explorer）』/ `Migaki Explorer`）。

## 🔗 リンク

- [GitHub リポジトリ](https://github.com/OOTORIKOTORI/tech-site)
- [サイト](https://migakiexplorer.jp)

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。

---

## 🏗️ 技術スタック

- **フレームワーク**: Nuxt（v3+）
- **言語**: TypeScript
- **テスト**: Vitest
- **スタイリング**: Tailwind CSS

---

## 🎨 ブランドガイド（最小版）

- サイト名: 「磨きエクスプローラー（Migaki Explorer）」
- トーン&マナー: 直接的・簡潔・実務志向（敬体、日本語）
- カラー（Tailwind 参照目安）
  - プライマリ: `blue-600`（アクセント/リンク）
  - テキスト: `gray-900` / 補助: `gray-600`
  - 成功: `green-600` / 警告: `amber-600` / エラー: `red-600`
- タイポグラフィ: デフォルト（システム UI）/ 等幅領域に `font-mono`
- ロゴ: 文字ロゴ（当面）。将来的に SVG ロゴを `public/logo.svg` に配置予定（未実装）
- アセット: `public/favicon.ico` 既存。OGP 既定画像は既存の `/og-default.png` を使用。

備考: 実装と乖離しないよう、配色/コンポーネントは Tailwind ユーティリティを優先して統一。

---

## 🚢 公開ポリシー / ドメイン / SEO

### 環境変数（必須）

- `NUXT_PUBLIC_SITE_ORIGIN`（Production 必須）: `https://migakiexplorer.jp`。canonical / og:url / robots / sitemap / RSS の基準。
- `NUXT_PUBLIC_SITE_URL` は互換の補助変数（将来削除予定）。

### ドメイン / リダイレクト

- 本番: `migakiexplorer.jp`（apex）。旧称・旧ドメイン（KOTORI Lab / `kotorilab.jp`）はすべて新ドメインへ恒久リダイレクト（308）し、ドキュメント上の残存表記は最新へ統一。
- DNS 例:
  - apex: `A(@)=76.76.21.21`
  - `www`: `CNAME=cname.vercel-dns.com`

確認コマンド（PowerShell）:

```powershell
iwr -Uri 'http://www.migakiexplorer.jp' -Method Head -MaximumRedirection 0 | Select-Object StatusCode, Headers
iwr -Uri 'https://migakiexplorer.jp/robots.txt'
iwr -Uri 'https://migakiexplorer.jp/sitemap.xml'
```

### プレビュー noindex

- `*.vercel.app` は host ベースで `X-Robots-Tag: noindex, nofollow` を付与（middleware 実装）。設定詳細は既存実装に準拠。

### サイトマップ / RSS / 検証（正準）

- Postbuild で `public/robots.txt` / `public/sitemap.xml` / `public/feed.xml` を生成。
- `<lastmod>` はブログ記事の Frontmatter `updated`（または `date`）。
- `--check-only` はホスト一致検証専用。OK ログ: `[gen-meta] OK robots/sitemap host = <host>`。

Workflow 上での meta-check 用 ENV 注入手順（集約・正準）:

- `.github/workflows/ci.yml` の postbuild 検証（`--check-only`）ステップで次の環境変数を付与して実行する。

  ```yaml
  - name: Meta host check
    run: node ./scripts/gen-meta.mjs --check-only
    env:
      NUXT_PUBLIC_SITE_ORIGIN: https://migakiexplorer.jp
      NUXT_PUBLIC_SITE_URL: ''
  ```

- 代替: 値は GitHub Actions の Variables/Secrets から参照してもよい（例: `${{ vars.SITE_ORIGIN }}`）。

## 🛠 CI/CD と品質ゲート

順序（実行中の基準・正準）:

1. Install（frozen lockfile）
2. Typecheck
3. Lint
4. Test（`--run`）
5. Build
6. Postbuild（`--check-only`）
7. Smoke:OG（200/302 合格）
8. LHCI

Lighthouse budgets:

- Desktop: perf ≥ 90 / a11y ≥ 90 / best‑practices ≥ 100 / SEO ≥ 100
- Mobile: perf ≥ 85 / a11y ≥ 90 / best‑practices ≥ 100 / SEO ≥ 100
- Workflow では desktop のみ `preset: desktop`。mobile は formFactor/env 指定（`preset: mobile` は未使用）。

Windows PowerShell tips:

```powershell
pnpm typecheck; pnpm lint; pnpm test -- --run; pnpm build; node .\scripts\gen-meta.mjs --check-only
```

### ビルド後処理（robots/sitemap/RSS の静的生成）

- Postbuild で `scripts/gen-meta.mjs` を実行し、`public/sitemap.xml` と `public/robots.txt` を生成。
- その後 `--check-only` でホスト一致を検証（正常時 `[gen-meta] OK ...`）。

### 実装補足

- `nuxt.config.ts` Nitro 設定: prerender.ignore で内部 API を静的化しない（dev 向けに `/blog/**` `/api/**` を対象外にする）。
- `error.vue`: 404/500 の簡易ページ。
- テスト: `tests/api/og.spec.ts`（OGP 200/302 と no-store ヘッダ）/ `tests/scripts/gen-meta.sitemap.test.ts`（サイトマップとホスト検証）。
- JWT: `test/jwt-es256.spec.ts` で ES256 の DER ↔ JOSE 変換。
- Nuxt グローバルスタブ: プラグイン/グローバル依存の安定化は app レベルのモック（`tests/setup/global-stubs.ts` 等）＋ `__mocks__` ディレクトリ運用で行う。テストは app-level mock を優先し、個別コンポーネントは必要最小のスタブに留める。
- Blog v2（実験/一時運用）: `/api/blogv2/list` と `/api/blogv2/doc` を暫定提供。当面は「確実に出す」ためのフォールバック可（将来削除前提）。

### テストノイズ低減（Nuxt グローバルスタブ）

- `__mocks__/` や app-level の provide/inject を活用し、**外部依存のスタブ化**を標準化する。
  - 例: analytics/ads の no-op 実装、日時/乱数の固定化、`vi.stubGlobal` によるテスト安定化。

### リリース運用（直 push 前提）

- Husky pre-push: `typecheck → lint → test → build → postbuild → smoke:og`。
- タグ運用: `vX.Y.Z`。コミット → タグ → push の簡易リリース。Release ノートは基本不要（必要に応じて `gh` CLI）。
- チェックリスト（抜粋）:
  - `NUXT_PUBLIC_SITE_ORIGIN`=https://migakiexplorer.jp（Production）
  - テスト green（cron/jwt/og/sitemap）
  - 主要ページの canonical/OG を確認
  - postbuild 検証ログ `[gen-meta] OK ...` を確認
  - www → apex の Permanent リダイレクト確認
  - 最新タグの確認: `git describe --tags --abbrev=0`
  - 法務ページ（`/privacy`, `/terms`, `/ads`）の雛形とフッタ導線の有無を確認

### 構造化データ（実装）

- **Organization.logo** は `/logo.png`（512x512）を絶対 URL で出力済み。将来は `logo.svg` 検討。
- **BlogPosting.publisher.logo** も出力済み（`Organization` を publisher として付与）。

#### BreadcrumbList JSON-LD（実装）

- /blog: Home > Blog
- /blog/[slug]: Home > Blog > 記事タイトル
- 生成例:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://migakiexplorer.jp/" },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://migakiexplorer.jp/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Sample Title",
      "item": "https://migakiexplorer.jp/blog/sample"
    }
  ]
}
```

実装: `composables/useBreadcrumbJsonLd.ts`（`buildBreadcrumbJsonLd` / `useBreadcrumbJsonLd`）。`utils/siteUrl.ts` の `siteUrl()` で絶対 URL 化。

#### a11y / スタイル（focus-visible のフォーカスリング統一）

- Tailwind ユーティリティ `.focus-ring` を定義（outline 無し / `focus-visible:ring-2` / `ring-offset-2` / `ring-blue-600`）。
- ヘッダナビやカード主要リンク（a / NuxtLink）に `.focus-ring` を付与して視認性を統一。
- 既存の outline / ring が重複する場合は競合しないよう整理（`.focus-ring` を優先）。

#### OGP API（最小ロギング・任意）

- 既定挙動は不変（`ENABLE_DYNAMIC_OG=1` で動的生成、デフォルトは 302 フォールバック / no-store）。
- `LOG_OG=1` を設定した場合のみ:
  - 成功（200）時: `console.info('[og:ok]', { slug, bytes })`
  - 失敗（302 フォールバック直前）: `console.warn('[og:fallback]', { slug, ua, err })`
- 本番はデフォルトで無効（静粛運用）。

#### 旧名/旧ドメイン（履歴）

- 旧名（KOTORI Lab / Kotorilab）や旧ドメイン表記が Docs に残っている場合は新ブランドへ修正。
- 旧ドメインからは恒久リダイレクト（308）を構成済み。現運用は `migakiexplorer.jp`。

---

## 変更点サマリ（この更新）

- ブランド表記を「磨きエクスプローラー（Migaki Explorer）」、公開ドメインを `https://migakiexplorer.jp` に統一。
- OGP API の既定 302 フォールバックと `ENABLE_DYNAMIC_OG=1` 時の 200 応答（失敗時は即 302）を明文化。
- robots/sitemap/RSS は postbuild の `scripts/gen-meta.mjs` が生成し、`--check-only` はホスト検証専用である旨を明記。
- CI の meta-check サンプルは本節に集約し、他ドキュメントでは参照誘導とした。
- 旧名称（KOTORI Lab / kotorilab.jp）に関する説明を最新ポリシーへ改め、記述の残存を排除。

---

## ブログ追加手順（運用）

1. `content/blog/*.md` に Frontmatter（`title/description/date/tags/draft/canonical`）。
2. 追加すると `/blog` 一覧へ自動反映。サイトマップ/RSS も postbuild で更新。
3. 参考テンプレ（DOM×DOW の OR/AND と TZ の落とし穴）: `cron-or-and-jst.md`, `first-cron-tz.md`, `gha-cron-utc.md` など。

---

## Troubleshooting: /blog が "No posts yet" のとき

確認順（上から潰す）:

1. 配置: Markdown が `content/blog/*.md` に存在するか（パス/拡張子綴り含め再確認）。
2. Frontmatter: `draft: false` か `draft` 未指定。`published: true` または `published` 未指定。例:

```yaml
---
title: Sample
date: 2025-01-01
draft: false
# published: true (省略可)
---
```

3. 一覧クエリ条件: 下書き除外 & 公開判定。

```js
where({ draft: { $ne: true } })
where({ $or: [{ published: true }, { published: { $exists: false } }] })
```

4. リンク: 一覧カードは `<NuxtLink :to="_path">` を使用。`_path` が欠落していないか（`only()` でフィールド削り過ぎていないか）を確認。

補足: date が未来でも除外ロジックは現状なし（必要なら将来 `date <= today` 条件を追加検討）。

### /blog 表示安定化（最短ルート方針）

- /blog/[...slug] の記事詳細は「最短&確実に表示」できるルートへ固定。
- 404 の再発要因（ゆらぎ/順序/メタ行ヒット）を潰す。
- dev 中は candidates/hits/chosen を console.debug で一撃可視化、prod では出さない。
- @nuxt/content v2 想定。$exists/$regex は使わず、候補配列と filter で解決。
- query は 'blog' 配下のみ。decodeURI 対応、末尾スラッシュ/大小文字ゆらぎ吸収。
- 404 は「doc が厳密一致で取れなかったときのみ」。白紙禁止。
- 一覧 → 記事の遷移は item.\_path をそのまま使う（連結生成しない）。
- ContentRenderer は doc.body がないレコードを描画しない。
- SSR で `doc` が無い場合は 404 を投げる（500 にしない）。

補遺（Blog v2 暫定 API の安定運用メモ）:

- `/api/blogv2/list` はコレクションごとに安全な select を行う。
  - blog: optional カラム（例: `updated`）を SQL で直接 SELECT しない。DB から全件取得して JS でマップ（`_path/_id`）。
  - docs: `content/docs` ディレクトリが存在する場合のみクエリする（存在しない場合はスキップ）。
  - JSON では `_path/_id` にマップして返す（safe‑select をやめ JS map に一本化）。
- 例外は握りつぶし、`200` として `{ blog:[], docs:[], errors:[{collection,message}] }` を返す。
- 表示判定は文字列ブール対応で `draft !== true && published !== false`（`'true'/'false'` を含む）。
- コネクタ依存の `$regex` / `$exists` は使用しない。

### Troubleshooting: /blog/[slug] で 500（ContentDoc 解決失敗）

- 動的 import（例: `new Function('s', 'return import(s)')` 経由で `'#content'` を読み込む）を使用しない。
- 代わりに静的 import を使用する: `import { queryContent } from '#content'`
- ページ側では `<ContentRenderer :value="doc" />` で描画し、グローバル登録の `<ContentDoc>` に依存しない。
- SSR で `doc` が無い場合は 404 を投げる（500 にしない）。
