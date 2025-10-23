既知=200／未知=404／白紙なし の動作チェックをクイック検証に追加

# 磨きエクスプローラー — Tech Tools & Notes（開発者向けユーティリティ＋技術メモ集）

本リポジトリは「Cron / JWT などの小ワークを即検証できる軽量ツール」と「再発しがちな実務の落とし穴を最小編集で整理した短文ブログ」を統合したサイトです。依存固定と postbuild 検証による安全なローカル再現、小さく差分を出す文化、CI での型チェック / Lint / テスト / ビルド / メタ検証 / OGP スモーク / ci:guards / Lighthouse 通過を公開条件とする品質ゲートを重視します。恒久ルール/詳細手順は `PROJECT_SPEC.md` および **docs/HANDBOOK.md**（Git/OGP/CI/リリース規約）を参照してください。

---

## プロジェクト構成ドキュメント

- プロジェクト構成: `pnpm docs:tree`（軽量） / `pnpm docs:tree:deep`（詳細）

## クイックチェック（要点）

- `queryContent`の扱い: SFC（`pages/blog/[...slug].vue`）ではグローバル利用を許容（先頭に `/* global queryContent */` を付記）。ランタイム/サーバ/コンポーザブルでは **`#content` から import**。`#imports` からの import は禁止。
- Markdown 形状ガードは`_archive`を**除外**
- Related（関連記事）は `/blog/**` のみ取得（`/blog/_archive/**` は除外）。`draft===true`/`published===false` は除外し、`body` が必須。**絞り込みタグは `tool:<tool-id>` を必須**（入門記事の frontmatter に付与する）。
- `pnpm run ops:rollback <tag>`で安定タグへスナップショット復元
- /blog 詳細は**1 経路のみ取得・白紙禁止・テンプレ 1 行**（詳細は PROJECT_SPEC 参照）

- Ads 運用: **Production のみ NUXT_PUBLIC_ENABLE_ADS=1。Preview/Dev は 0**。審査/デバッグ時のみ ENABLE_ADS_DEBUG=1 を一時使用。本文に pagead/js/adsbygoogle.js?client= が出ること。

  - **ads.txt は `pub-…` 形式。配置は `/public/ads.txt`（詳細は PROJECT_SPEC を参照）**
  - プライバシーポリシーに AdSense 必須記載（第三者ベンダー/Cookie/Ads Settings リンク）を維持する

- **ツールカード統一**: `/tools` 一覧の各カードに「対象読者・所要時間・入出力例」の 3 項目を表示（無いツールは `—`）。
- **RelatedList コンポーネント**: `components/RelatedList.vue` で tags ベースの関連記事 3 件を表示。ツール詳細ページ末尾に設置。**相互リンク方針**: ツール側は導入直下に「入門記事へのリンク」、入門記事側は冒頭/末尾に「関連ツール: /tools/<id>」を明記。
- 新ツール: `/tools/json-formatter`（JSON 整形/最小化/検証）, `/tools/regex-tester`（正規表現の一致テスト）を追加。

- クイック検証: `/api/og/hello.png` が **200 または 302** であること（smoke:og 合格基準）。

* **smoke:og**: `https://<ORIGIN>/api/og/hello.png` に対し **200 または 302** なら合格。308/301 を踏む場合も **1 回のみ自動フォロー**して再判定（URL 結合は `new URL()` で正規化済み）。

## ブランド・ORIGIN・ルール序列

- ブランド: 「磨きエクスプローラー（Migaki Explorer）」／短縮名「Migaki Explorer」
- ORIGIN: https://migakiexplorer.jp
- ルール序列: 正準=PROJECT_SPEC / 要点=README / 規約=HANDBOOK

## ブランド名の一元化（概要）

- 管理場所: `app.config.ts`（`site.brand` / `site.tagline`）。参照は `composables/useSiteBrand.ts` 方針。
- 正式名は『磨きエクスプローラー（Migaki Explorer）』、表示/短縮名は常に `Migaki Explorer` を使用。
- 反映先: `<title>` 既定、`og:site_name`、JSON-LD の `Organization.name` / `BlogPosting.publisher.name`。
- ロゴ代替テキストは `/logo.png` に対し 'Migaki Explorer' を推奨。
- 詳細は PROJECT_SPEC「サイト設定 / ブランド名」を参照。

---

## 要点（実装済みの方針・抜粋）

- `/tools/og-check` で OG タグ/OG 画像の 200/302 を即確認（SSR でも絶対 URL 運用）
- `/tools/site-check` で robots/sitemap/feed をまとめて取得・ORIGIN 一致の簡易検証に加え、最終 URL を 1 回だけフェッチして meta/canonical/JSON‑LD/基本セキュリティヘッダ（CSP/HSTS 等）の有無を概況表示（JSON‑LD は型/件数/主要プロパティのみを抜粋）

- 生成物の表記を統一: `robots.txt` / `sitemap.xml` / `feed.xml`（postbuild で生成）。
- ORIGIN 基準の一元化: `NUXT_PUBLIC_SITE_ORIGIN` を canonical / og:url / robots / sitemap / RSS の基点に使用。
- プレビュー noindex: `*.vercel.app` は `X-Robots-Tag: noindex, nofollow` を付与（middleware）。
- 構造化データ: Organization.logo は `/logo.png` 絶対 URL、BlogPosting.publisher.logo、BreadcrumbList（/blog, /blog/[slug]）。
- a11y: `focus-visible` は `.focus-ring` ユーティリティで統一（主要リンク/ナビに適用）。
- OGP API: 既定は 302 で `/og-default.png` へフォールバック。`ENABLE_DYNAMIC_OG=1` で動的 PNG（失敗時は即 302）。`LOG_OG=1` で最小ログ。
- CI 概要: install → typecheck → lint → test → build → postbuild（`--check-only`）→ smoke:og → ci:guards → LHCI（詳細は PROJECT_SPEC）。
  - LHCI は本番が **200 になるまで待機**してから収集し、失敗時は **1 回だけリトライ**。
  - budgets は参考値であり、CI の合否は Accessibility ≥ 90 / Best Practices ≥ 0.70 のアサートに従う。
- （任意）Web App Manifest の `name`/`short_name` はブランド準拠。詳細は `PROJECT_SPEC.md` を参照。
- /blog 詳細は**1 経路のみ取得・白紙禁止・テンプレ 1 行**（`<ContentRenderer v-if="doc?.body" :value="doc" />`）。詳細は[PROJECT_SPEC.md](./PROJECT_SPEC.md)参照。
- `queryContent`の扱い統一: SFC（`pages/blog/[...slug].vue`）はグローバル許容（`/* global queryContent */`）、それ以外は **`#content` から import**。`#imports` は禁止。
- Markdown 形状ガードは`_archive`を除外。
- `pnpm run ops:rollback <tag>`で安定タグへスナップショット復元。

## /blog 詳細 404/白紙対策（要点）

- 1 経路のみ（findOne(exactPath)優先、where({\_path})も可。filter 等の手動選択は禁止）
- `<ContentRenderer v-if="doc?.body" :value="doc" />`（テンプレ 1 行）
- SSR は絶対 URL を使用
- `body`が無い場合は 404（白紙禁止）
- 詳細は[PROJECT_SPEC.md](./PROJECT_SPEC.md)参照

補足: 具体的な確認手順（API 応答/robots meta/一覧の挙動/SSR 500 回避・プレビュー noindex など）は docs/HANDBOOK.md の「検証ブロック」を参照してください。

---

## Troubleshooting: /blog 詳細表示の 404/白紙対策

/blog/[...slug] の記事詳細は `findOne(exactPath)` または `where({_path})` の**1 経路のみ**で取得し、filter 等の**手動選択は禁止**。`body` が無い場合は 404（白紙禁止）。

---

### クイック検証チェックリスト

- \_control は noindex、feed/sitemap に含まれない（ci:guards で検知）
- ローカル確認: `pnpm run ops:smoke` （BASE_URL で本番にも適用可）
- 既知 slug で 200 / 未知 slug で 404 / **白紙なし**

- `/__nuxt_content/blog/sql_dump.txt` が読める
- `/blog/hello-world` が 200
- dev console に candidates/hits/chosen が出る

---

## CI 概要（要点）

- 順序: install → typecheck → lint → test → build → postbuild（`--check-only`でホスト一致検証）→ smoke:og → ci:guards → LHCI。
- meta-check では`NUXT_PUBLIC_SITE_ORIGIN=https://migakiexplorer.jp`を明示。
- 詳細・閾値・テスト基盤は[PROJECT_SPEC.md](./PROJECT_SPEC.md)参照。
- ※ LHCI の budgets は参考。CI の合否は Accessibility ≥ 90 / Best Practices ≥ 0.70 を採用。

---

## 実装メモ（抜粋）

- ヘッダ最小ナビ（Home/Tools/Blog）と Skip リンクは実装済み。
- フッタに `/privacy` `/terms` `/ads` への導線あり。
- Nuxt グローバルスタブ運用（`tests/setup/global-stubs.ts` 等）。

---

## UI/情報設計(運用追記)

- Top: 「最新記事」として **/blog の新着 4 件** を表示（`audience` 必須、`draft !== true`, `published !== false`）。スケルトン → 空 → 表示の 3 分岐を維持し、末尾に「すべて見る」→ /blog。
- Tools: 各ページ冒頭に `<ToolIntro>`(説明/使い方/例)を設置。主要ツールには page 個別の useHead を付与。

## 運用メモ(抜粋)

- pre-push 例: `typecheck → lint → test → build → postbuild → smoke:og → ci:guards → LHCI`。
  - 備考: `ci:guards` には `guard-audience`（ブログ記事の frontmatter に audience を要求）が含まれます。
    - ローカル実行: `pnpm run ci:guards`（すべてのガードを一括実行）
- 主要リンクの `focus-visible` は `.focus-ring` を適用し視認性を統一。

---

## ブログ追加の手順

1. `content/blog/*.md` を追加し、Frontmatter を付与: `title`, `description`, `date`, `tags`, `draft`, `canonical`。**`audience` を原則必須**（タイトル直下に AudienceNote を表示）。
2. 追加後は `/blog` 一覧・トップの「Latest posts」・サイトマップ・RSS に自動反映。
3. 記事テンプレ/参考: DOM×DOW の OR/AND とタイムゾーンの落とし穴

- ブログは原則 結論 → 手順 → 補足 の順で簡潔に。frontmatter の `audience` があればタイトル直下に対象ブロック（AudienceNote）を表示します。

### Tips: 差分限定の pre-commit（guard-audience のみ）

`content/` 配下に変更があるコミットだけ、軽量に `guard-audience` を走らせたい場合の例です（フック本体は変更不要・任意）。

- Bash（`.husky/pre-commit` など）:

```bash
changed=$(git diff --cached --name-only | grep -E '^content/')
if [ -n "$changed" ]; then
  node scripts/ci/guard-audience.cjs || exit 1
fi
```

- PowerShell（Windows 環境でローカルチェックしたい場合の例）:

```powershell
$changed = git diff --cached --name-only | Select-String '^content/'
if ($changed) {
  node .\scripts\ci\guard-audience.cjs
  if ($LASTEXITCODE -ne 0) { exit 1 }
}
```

上記はあくまで Tips であり、CI 本番では `ci:guards` の一部として `guard-audience` が実行されます。

**リセット時の状態**: welcome のみ公開 / アーカイブは internal タグで非露出

- 例: `content/blog/cron-or-and-jst.md`, `content/blog/first-cron-tz.md`, `content/blog/gha-cron-utc.md`

---

## 既知の仕様（Cron / JWT 抜粋）

- Cron: `dowDomMode` は `'OR'|'AND'`。`'*'` の解釈は OR=unrestricted / AND=always‑true。`dow` は 0–6（0=Sun、7 非対応）。
- Cron JST ツール: 人間可読の説明表示（JST/UTC）、次回実行の件数切替（5/10/25）、6 フィールド（秒）と `@hourly` 等エイリアスをサポート。
- Auto-reload: `configVersion` / `settingsUpdatedAt` 変更時は次 tick（10s）で再読込（進行中は継続）。
- JWT/ES256: DER ↔ JOSE 相互変換、Claims 境界、`alg`/`kid` の異常系テストが green。
- JWT Decoder: 既定はデコードのみ、任意で Verify(HS256/RS256/JWKS) を ON 可。`exp/nbf/iat` のバッジ表示（OK/警告/エラー）に対応。

---

## クイックチェック（要点）

- ローカルでのホスト検証（PowerShell）:

```powershell
pnpm build; node .\scripts\gen-meta.mjs --check-only
```

OK ログ例: `[gen-meta] OK sitemap/feed[/robots] host = <host>  （robots.txt は任意。無い場合は /robots なし）`
robots.txt はサーバールートで返せるため静的生成は任意。静的に出す場合は GENERATE_ROBOTS=1 を設定。

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

補足: ローカル開発では `.env.local` の `NUXT_PUBLIC_SITE_ORIGIN` を `http://localhost:3000` に設定してください（dev の各種リンク/メタ生成が正しく動作します）。

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

## リリース手順

- 実運用の詳細な手順は [docs/HANDBOOK.md の Release Checklist](docs/HANDBOOK.md#release-checklistリリース手順) を参照（README では要点のみ）。

## 変更点サマリ（この更新）

- README を「要点＋参照」に整理（詳細は PROJECT_SPEC に集約）。
- ブランド正式名/短縮名、ORIGIN/RSS/OGP/a11y/構造化データの指針を明記。

## /blog E2E の契約（要点）

- known slug: 200 + 本文レンダリング（例: `<article`）
- missing slug: 404 + 白紙ではない（テンプレ見出しが出る / `data-testid="error-heading"`）
- SSR 相対 URL 回帰の検知: レスポンスに `"Only absolute URLs are supported"` を含まないこと

### E2E の ORIGIN 解決順

1. `process.env.E2E_ORIGIN`
2. `process.env.ORIGIN`
3. `process.env.NUXT_PUBLIC_SITE_URL`
4. `http://localhost:3000`

---

## `/tools/top-analyzer`（top ログ可視化ツール）

- **対象**: SRE・運用・開発の初動調査向け
- **できること**: top コマンドの CPU/Mem/Load を時系列グラフ化し、ピークや異常を素早く把握
  - 各グラフで凡例トグル可（系列の一時非表示）
  - **SVG/PNG 保存** — SVG は viewBox に 12px 余白を付与してラベル/目盛りの欠けを防止、PNG は白背景で安定出力
  - しきい値入力に**単位/桁ガイド（CPU% / Load / Mem MB）** を表示し入力を補助
- **安全性**: ブラウザ内のみで完結（ファイルアップロードなし、プライバシー重視）
- **使い方例**:
  - サーバで `top -b -d 5 -n 1000 > top_YYYY-MM-DD.log` で収集
  - `/tools/top-analyzer` でファイルを選択し解析
  - CSV エクスポート（英語/日本語ヘッダ切替対応）
  - サンプルログのダウンロード機能
- **導線**: トップページ・ツール一覧からアクセス可
