# プロジェクト仕様書 - 磨きエクスプローラー（Migaki Explorer）

## 📋 プロジェクト概要

### プロジェクト名

**磨きエクスプローラー（Migaki Explorer）** - 開発者向けツールサイト

### サイト概要

本サイトは「便利ツール＋技術ブログ」の開発者向け情報サイトです。
ツールはローカル完結（ブラウザ/Node 内）と安全性を重視し、記事は実務志向の短文ノートを配信します。
公開ドメイン: https://migakiexplorer.jp

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

- Vercel での CD（自動デプロイ）を採用し、`NUXT_PUBLIC_SITE_ORIGIN` は本番独自ドメインを必須（例: https://migakiexplorer.jp）。
- robots.txt / sitemap.xml / feed.xml は postbuild（`scripts/gen-meta.mjs`）で生成し、`--check-only` でホスト一致を検証（ホスト検証専用）。

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

## 🔗 リンク

- [GitHub リポジトリ](https://github.com/OOTORIKOTORI/tech-site)
- [サイト](https://migakiexplorer.jp)

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。

---

## 🏗️ 技術スタック

- **フレームワーク**: Nuxt 4
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

- `NUXT_PUBLIC_SITE_ORIGIN`（Production 必須）: `https://migakiexplorer.jp`。canonical / og:url / robots / sitemap の基準。
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

- `*.vercel.app` は host ベースで `X-Robots-Tag: noindex, nofollow` を付与（middleware 実装）。

### サイトマップ / RSS / 検証

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

順序（実行中の基準）:

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

### ビルド後処理（sitemap/robots の静的生成）

- Postbuild で `scripts/gen-meta.mjs` を実行し、`public/sitemap.xml` と `public/robots.txt` を生成。
- その後 `--check-only` でホスト一致を検証（正常時 `[gen-meta] OK ...`）。

### 実装補足

- `nuxt.config.ts` Nitro 設定: prerender.ignore で内部 API を静的化しない。
- `error.vue`: 404/500 の簡易ページ。
- テスト: `tests/api/og.spec.ts`（OGP 200/302 と no-store ヘッダ）/ `tests/scripts/gen-meta.sitemap.test.ts`（サイトマップとホスト検証）。
- JWT: `test/jwt-es256.spec.ts` で ES256 の DER ↔ JOSE 変換。
- Nuxt グローバルスタブ: プラグイン/グローバル依存の安定化は app レベルのモック（`tests/setup/global-stubs.ts` 等）＋ `__mocks__` ディレクトリ運用で行う。テストは app-level mock を優先し、個別コンポーネントは必要最小のスタブに留める。

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
- 既存の outline / ring が重複する場合は競合しないよう整理。

#### OGP API（最小ロギング・任意）

- 既定挙動は不変（`ENABLE_DYNAMIC_OG=1` で動的生成、デフォルトは 302 フォールバック / no-store）。
- `LOG_OG=1` を設定した場合のみ:
  - 成功（200）時: `console.info('[og:ok]', { slug, bytes })`
  - 失敗（302 フォールバック直前）: `console.warn('[og:fallback]', { slug, ua, err })`
- 本番はデフォルトで無効（静粛運用）。

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
