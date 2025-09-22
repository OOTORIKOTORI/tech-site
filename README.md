# 磨きエクスプローラー — Tech Tools & Notes（開発者向けユーティリティ＋技術メモ集）

フロント/バックエンドの“毎回ググる小ワーク”を手元で安全・素早く検証できる軽量ツール（Cron / JWT など）と、実装運用の落とし穴を最小編集でまとめた短文ブログを提供するサイトです。収益はディスプレイ広告を想定。ローカル完結と品質ゲートを重視しています。

ブランド: 磨きエクスプローラー（Migaki Explorer） / 本番ドメイン: https://migakiexplorer.jp

---

## 導線とページ構成（現状）

- トップ `/`:
  - ヒーロー＋ CTA（`/tools/cron-jst`, `/blog`）。
  - 「Latest posts」で最新 3 件を表示（Nuxt Content の `date` 降順）。
- ブログ一覧 `/blog`:
  - タイトル / 日付（YYYY-MM-DD） / 説明 / リンクをカード表示。カードに a11y ラベル付与。
  - 投稿 0 件時は「No posts yet」を表示。
- ブログ詳細 `/blog/[slug]`:
  - 本文レンダリング＋ SEO メタ（title/description/canonical/og:url）。
  - `canonical` は Frontmatter で指定可（未指定時は自動）。
- 既存ツール:

  - Cron JST 予測: `/tools/cron-jst`
  - JWT Decode: `/tools/jwt-decode`

- フッタ: `/privacy`, `/terms`, `/ads` への導線を設置。

ナビゲーション:

- ヘッダは **Home / Tools / Blog**。**「メインへスキップ」**リンクを設置。

サイトマップ/フィード:

- `scripts/gen-meta.mjs` により `public/sitemap.xml` と `public/robots.txt` を生成。
- サイトマップにはブログ URL を含め、`<lastmod>` は Frontmatter の `updated`（なければ `date`）。
- RSS は `public/feed.xml` を postbuild で生成（チャネル `/blog`、各 item は title/link/pubDate/description）。

---

## SEO / OGP / プレビュー方針

- 絶対 URL 化: `canonical` と `og:url` は `NUXT_PUBLIC_SITE_ORIGIN` を基準に絶対 URL を生成（`utils/siteUrl.ts` / `utils/siteMeta.ts`）。
- 互換変数: `NUXT_PUBLIC_SITE_URL` は互換の補助（将来削除予定）。
- プレビュー noindex: ホストが `*.vercel.app` の場合はミドルウェアで `X-Robots-Tag: noindex, nofollow` を付与（環境変数に依存しない）。
- OGP API（安定デフォルト）:
  - `GET /api/og/[slug].png` は既定で 302 により `/og-default.png` へフォールバック。
  - レスポンスヘッダ: `Cache-Control: no-store`, `X-OG-Fallback: 1`。
  - `ENABLE_DYNAMIC_OG=1` で軽量 PNG を動的生成（試験的）。失敗時は即時 302 フォールバック。
  - `scripts/smoke-og.mjs` は 200/302 を合格とするスモークテスト。

---

## CI/CD と品質ゲート

ジョブ順序（推奨・運用中）:

1. install（frozen lockfile）→ 2) typecheck → 3) lint → 4) test → 5) build → 6) postbuild（`--check-only` 検証）→ 7) smoke:og → 8) LHCI。

Lighthouse 閾値（budgets）:

- desktop: perf ≥ 90 / a11y ≥ 90 / best‑practices ≥ 100 / SEO ≥ 100
- mobile: perf ≥ 85 / a11y ≥ 90 / best‑practices ≥ 100 / SEO ≥ 100
- ワークフロー上は desktop のみ `preset: desktop` を使用。mobile は `formFactor` / `screenEmulation` などで指定（`preset: mobile` は未使用）。

テスト基盤: Vitest は `clearMocks: true` と `environmentOptions.jsdom.url=https://migakiexplorer.jp` を既定化し、`tests/setup/global-stubs.ts` を常時読み込み。

Postbuild の検証:

- `scripts/gen-meta.mjs --check-only` が robots/sitemap のホスト一致を検証。
- 一致時ログ: `[gen-meta] OK robots/sitemap host = <host>`。不一致はビルド失敗。

Workflow 上での meta check 用 ENV 注入（例）:

```yaml
- name: Meta host check
  run: node ./scripts/gen-meta.mjs --check-only
  env:
    NUXT_PUBLIC_SITE_ORIGIN: https://migakiexplorer.jp
    NUXT_PUBLIC_SITE_URL: ''
```

代替: 値は GitHub Actions の Variables/Secrets から参照してもよい（例: `${{ vars.SITE_ORIGIN }}`）。

---

## 実装 TODO（短期）

（実装済み）ヘッダに **最小ナビ（Home/Tools/Blog）** と **Skip リンク**
（実装済み）ブログ一覧カード: **日付 `YYYY-MM-DD`** / **a11y ラベル**
（実装済み）フッタに **/privacy /terms /ads** への導線
（実装済み）**Nuxt グローバルスタブ** 運用（`__mocks__/` 等）

→ 上記は「導線とページ構成（現状）」等の現状仕様各節に反映済み。

---

## 開発運用（直 push 前提）

- Husky pre-push（順次実行）:
  - `pnpm typecheck; pnpm lint; pnpm test -- --run; pnpm build; pnpm postbuild; pnpm run smoke:og`
  - 既存の `husky.sh` シム行は削除済み。
- タグ運用: `vX.Y.Z`。コミット → タグ付け → push で簡易リリース。リリースノートは基本不要（必要時は `gh` CLI で補助）。
  - Windows: `pnpm run tag:patch` 等が使えます。Mac/Linux は `pwsh` が無い場合、`./scripts/bump-tag.ps1 patch` を直接実行してください。
- Windows PowerShell では `;` で連結推奨。パッチ差分出力は `Out-File -Encoding utf8 -Width 4096` を推奨。

チェック（抜粋）: 法務ページ（`/privacy`, `/terms`, `/ads`）の雛形とフッタ導線の有無を確認。

例（PowerShell）:

```powershell
git add -A; git diff --staged --no-color | Out-File -FilePath review.patch -Encoding utf8 -Width 4096
pnpm typecheck; pnpm lint; pnpm test -- --run; pnpm build; pnpm postbuild; pnpm run smoke:og
```

例（bash）:

```bash
git add -A && git diff --staged --no-color > review.patch
pnpm typecheck && pnpm lint && pnpm test -- --run && pnpm build && pnpm postbuild && pnpm run smoke:og
```

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

## クイックチェック（運用）

- ローカルビルドとホスト検証（PowerShell）:

```powershell
pnpm build; node .\scripts\gen-meta.mjs --check-only
```

- ドメイン/リダイレクト確認（PowerShell）:

```powershell
iwr -Uri 'http://www.migakiexplorer.jp' -Method Head -MaximumRedirection 0 | Select-Object StatusCode, StatusDescription, Headers
iwr -Uri 'https://migakiexplorer.jp/robots.txt'
iwr -Uri 'https://migakiexplorer.jp/sitemap.xml'
```

- 同（bash）:

```bash
curl -sI http://www.migakiexplorer.jp | sed -n '1p; s/^Location: //p'
curl -s https://migakiexplorer.jp/robots.txt | sed -n '1,3p'
curl -s https://migakiexplorer.jp/sitemap.xml | head -n 5
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

- Organization.logo は `/logo.png`（512x512）を**絶対 URL**で出力。将来は `logo.svg` への差し替え検討。
- BlogPosting の `publisher.logo` も出力済み（`Organization` を `publisher` として付与）。

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
