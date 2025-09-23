# 磨きエクスプローラー — Tech Tools & Notes（開発者向けユーティリティ＋技術メモ集）

フロント/バックエンドの“毎回ググる小ワーク”を手元で安全・素早く検証できる軽量ツール（Cron / JWT など）と、実装運用の落とし穴を最小編集でまとめた短文ブログを提供するサイトです。ローカル完結と品質ゲートを重視しています。

- 正式名: 『磨きエクスプローラー（Migaki Explorer）』
- 表示/短縮名: Migaki Explorer（`<title>` / og:site_name / Organization.name / publisher.name）
- 本番 ORIGIN: https://migakiexplorer.jp

## ブランド名の一元化（概要）

- 管理場所: `app.config.ts`（`site.brand` / `site.tagline`）。参照は `composables/useSiteBrand.ts` 方針。
- 正式名は『磨きエクスプローラー（Migaki Explorer）』、表示/短縮名は常に `Migaki Explorer` を使用。
- 反映先: `<title>` 既定、`og:site_name`、JSON-LD の `Organization.name` / `BlogPosting.publisher.name`。
- ロゴ代替テキストは `/logo.png` に対し 'Migaki Explorer' を推奨。
- 詳細は PROJECT_SPEC「サイト設定 / ブランド名」を参照。

---

## 要点（実装済みの方針）

- 生成物の表記を統一: `robots.txt` / `sitemap.xml` / `feed.xml`（postbuild で生成）。
- ORIGIN 基準の一元化: `NUXT_PUBLIC_SITE_ORIGIN` を canonical / og:url / robots / sitemap / RSS の基点に使用。
- プレビュー noindex: `*.vercel.app` は `X-Robots-Tag: noindex, nofollow` を付与（middleware）。
- 構造化データ: Organization.logo は `/logo.png` 絶対 URL、BlogPosting.publisher.logo、BreadcrumbList（/blog, /blog/[slug]）。
- a11y: `focus-visible` は `.focus-ring` ユーティリティで統一（主要リンク/ナビに適用）。
- OGP API: 既定は 302 で `/og-default.png` へフォールバック。`ENABLE_DYNAMIC_OG=1` で動的 PNG（失敗時は即 302）。`LOG_OG=1` で最小ログ。
- CI 概要: install → typecheck → lint → test → build → postbuild（`--check-only`）→ smoke:og → LHCI（詳細は PROJECT_SPEC）。
- （任意）Web App Manifest の `name`/`short_name` はブランド準拠。詳細は `PROJECT_SPEC.md` を参照。

---

詳細仕様やコード参照は `PROJECT_SPEC.md` を参照してください（README は要点のみ）。

---

## CI 概要（要点）

- 順序: install → typecheck → lint → test → build → postbuild（`--check-only` でホスト一致検証）→ smoke:og → LHCI。
- meta-check では `NUXT_PUBLIC_SITE_ORIGIN=https://migakiexplorer.jp` を明示（`NUXT_PUBLIC_SITE_URL=''`）。
- 具体例・閾値・テスト基盤の詳細は `PROJECT_SPEC.md` を参照。

---

## 実装メモ（抜粋）

- ヘッダ最小ナビ（Home/Tools/Blog）と Skip リンクは実装済み。
- フッタに `/privacy` `/terms` `/ads` への導線あり。
- Nuxt グローバルスタブ運用（`tests/setup/global-stubs.ts` 等）。

---

## 運用メモ（抜粋）

- pre-push 例: `typecheck → lint → test → build → postbuild → smoke:og`。
- 主要リンクの `focus-visible` は `.focus-ring` を適用し視認性を統一。

---

## ブログ追加の手順

1. `content/blog/*.md` を追加し、Frontmatter を付与: `title`, `description`, `date`, `tags`, `draft`, `canonical`。
2. 追加後は `/blog` 一覧・トップの「Latest posts」・サイトマップ・RSS に自動反映。
3. 記事テンプレ／参考: DOM×DOW の OR/AND とタイムゾーンの落とし穴
   - 例: `content/blog/cron-or-and-jst.md`, `content/blog/first-cron-tz.md`, `content/blog/gha-cron-utc.md`

---

## 既知の仕様（Cron / JWT 抜粋）

- Cron: `dowDomMode` は `'OR'|'AND'`。`'*'` の解釈は OR=unrestricted / AND=always‑true。`dow` は 0–6（0=Sun、7 非対応）。
- Auto-reload: `configVersion` / `settingsUpdatedAt` 変更時は次 tick（10s）で再読込（進行中は継続）。
- JWT/ES256: DER ↔ JOSE 相互変換、Claims 境界、`alg`/`kid` の異常系テストが green。

---

## クイックチェック（要点）

- ローカルでのホスト検証（PowerShell）:

```powershell
pnpm build; node .\scripts\gen-meta.mjs --check-only
```

---

### ローカルでの ORIGIN 明示（混乱回避）

- PowerShell（一時適用）:

  ```powershell
  $env:NUXT_PUBLIC_SITE_ORIGIN='https://migakiexplorer.jp'; pnpm postbuild
  ```

- `.env.local`（恒久）:

  ```
  NUXT_PUBLIC_SITE_ORIGIN=https://migakiexplorer.jp
  ```

## セットアップ / 開発

依存関係のインストール:

```bash
pnpm install
```

開発サーバー:

```bash
pnpm dev
```

本番ビルド / プレビュー:

```bash
pnpm build
pnpm preview
```

注意: Production では `NUXT_PUBLIC_SITE_ORIGIN=https://migakiexplorer.jp` が必須。robots/sitemap のホスト不一致は postbuild 検証で失敗します。

Nuxt グローバルスタブ指針:

- プラグインやグローバル依存の安定化は app レベルのモック（`tests/setup/global-stubs.ts` 等）＋ `__mocks__` ディレクトリを用いて管理。コンポーネント単位のスタブは必要最小に留める。

構造化データ（実装）:

- Organization.logo は `/logo.png`（512x512）を絶対 URL で出力。
- BlogPosting の `publisher.logo` も出力済み。
- BreadcrumbList JSON-LD を /blog /blog/[slug] に出力（詳細は `PROJECT_SPEC.md`）。

タグの最新取得（SemVer 運用）:

```powershell
git describe --tags --abbrev=0
```

補足（yarn を使う場合）:

```bash
yarn install
yarn dev
yarn build
yarn preview
```

ローカル検証は `pnpm run ci:local`

---

## 参考リンク

- 仕様詳細は `PROJECT_SPEC.md` を参照
- Nuxt デプロイ: https://nuxt.com/docs/getting-started/deployment

---

## 変更点サマリ（この更新）

- README を「要点＋参照」に整理（詳細は PROJECT_SPEC に集約）。
- ブランド正式名/短縮名、ORIGIN/RSS/OGP/a11y/構造化データの指針を明記。
