# KOTORI Lab — Tech Tools & Notes（開発者向けユーティリティ＋技術メモ集）

フロント/バックエンドの日常作業で「毎回ググって再発明する」小さな処理を“手元で即確認・共有”できるようにする軽量ツール群（Cron/JWT など）と、実装や運用で詰まりやすいポイントを最小編集で整理した技術ブログ（短文ノート）をまとめたサイトです。収益モデルは広告掲載を想定しつつ、ローカルで完結する安全な検証 UI を重視しています。

ブランド: KOTORI Lab / ドメイン: https://kotorilab.jp （現在本番稼働中）

---

# Tools

- Cron JST: `/tools/cron-jst`
- JWT Tool: `/tools/jwt-decode`

# Cron JST 次回実行予測ツール

日本時間（JST）や UTC で crontab 形式のスケジュールから次回実行時刻を即座に予測できる Web ツールです。

![Cron JST ツール画面](./assets/cron-jst-sample.png 'Cron JSTツール画面サンプル')

<div align="center"><sub>※画像はサンプル。alt: Cron JSTツールの入力・プリセット・共有リンクUI・結果リストが表示された画面</sub></div>

### 主な機能

- crontab 形式（分 時 日 月 曜日）で次回実行時刻を JST/UTC 両方で表示
- 共有リンク生成（現在の設定を URL 化しコピー）
- プリセット（よく使う cron 式をワンクリック挿入）
- CSV ダウンロード（表示中の全結果を CSV で保存）
- 完全ローカル処理（入力はサーバー送信されません）
- アクセシビリティ配慮（aria 属性・キーボード操作・コントラスト強化）
- SEO 対応（title/meta/OGP/description 追加）

### 使い方

1. crontab 形式でスケジュールを入力（例: `*/5 9-18 * * 1-5`）
2. 必要に応じてプリセットから選択
3. 「今すぐチェック」で次回実行予定を表示
4. 「共有リンクをコピー」で現在の設定を URL 化し、他者と共有可能
5. 「CSV でダウンロード」で結果を CSV 保存

#### 共有リンク例

```
https://kotorilab.jp/tools/cron-jst?expr=0+9+*+*+1&n=10&tz=Asia%2FTokyo&rel=now
```

この URL を開くと「毎週月曜 9 時、10 件、JST、基準は今」で即座に予測結果が表示されます。

#### プリセット例

- 平日 9-18 時に 5 分毎: `*/5 9-18 * * 1-5`
- 毎日 0 時: `0 0 * * *`
- 毎時 0 分: `0 * * * *`
- 毎月 1 日 0 時: `0 0 1 * *`
- 毎週日曜 12 時: `0 12 * * 0`
- 毎週月曜 9 時: `0 9 * * 1`
- 毎分: `* * * * *`

#### アクセシビリティ・SEO

- aria-label/role/aria-live 等でスクリーンリーダー対応
- キーボード操作・フォーカスリング・コントラスト強化
- title/meta/OGP/description で SEO 最適化

---

# Tech Site

Tech Site は「便利ツール＋技術ブログ」の開発者向け情報サイトです。主要セクションは Tools / Blog。収益モデルは広告（ディスプレイ/コンテンツ連動）を主軸としています。

## Features (v1.1)

- **DOM×DOW は dowDomMode ('OR'|'AND') で切替。'\*' は OR=unrestricted / AND=always-true。**
- **'\*' Interpretation**: OR=unrestricted / AND=always-true
- **DOW Range**: dow=0–6 (0=Sun); 7 unsupported, **name tokens unsupported**
- **Auto-reload**: tick=10s, `configVersion`/`settingsUpdatedAt` change→**next tick** reload, in-flight continue

## Quick Start

1. Install dependencies (`pnpm install`)
2. Set `dowDomMode` in config if needed (default is 'OR')
3. Start server and use the cron tool

### Configuration Examples

**Default (OR mode):**

```json
{
  "scheduler": {
    "dowDomMode": "OR"
  }
}
```

**AND mode:**

```json
{
  "scheduler": {
    "dowDomMode": "AND"
  }
}
```

## Configuration

- `dowDomMode`: 'OR'|'AND' (default 'OR')
- dom: 1–31
- mon: 1–12
- dow: 0–6 (0=Sun, 7 unsupported)

## Spec

- See [PROJECT_SPEC.md](PROJECT_SPEC.md) for full details

## CSV 仕様（ダウンロード）

- 文字コード: UTF-8（BOM 付き）
- 列構成: `#,ISO,JST,UTC,relative`
- 値にカンマやダブルクオートが含まれる場合は RFC 4180 に準拠してダブルクオートでエスケープ

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

## 環境変数

| 変数名 | 必須 | 用途 | 例 |
|--------|------|------|----|
| `NUXT_PUBLIC_SITE_URL` | Yes | OGP/canonical/robots/sitemap で利用するサイトのベース URL（末尾スラッシュ無し推奨） | `https://kotorilab.jp` / `https://<project>.vercel.app` |

本番デプロイ時は独自ドメインを設定し、その値を Vercel 等の環境変数に登録してください。未設定の場合は `http://localhost:3000` が使用され、OGP や canonical がローカル参照になるため検索エンジン向けには非推奨です。


# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

注意: Sitemap/robots のホストは `NUXT_PUBLIC_SITE_URL` と一致している必要があります。不一致の場合はビルド（postbuild の検証）で失敗します。

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information。

### Domain & Redirect Check

```powershell
# www → apex が Permanent（301/308）で遷移することを確認
iwr -Uri 'http://www.kotorilab.jp' -Method Head -MaximumRedirection 0 | Select-Object StatusCode, StatusDescription, Headers

# 本番 robots/sitemap を確認
iwr -Uri 'https://kotorilab.jp/robots.txt'
iwr -Uri 'https://kotorilab.jp/sitemap.xml'
```

※ Vercel のドメインリダイレクトは既定で 308 を返す場合があります。SEO 的には 301 と同等に扱われます。

**Post-build outputs**

- `public/robots.txt`（`Sitemap: https://kotorilab.jp/sitemap.xml` を含む）
- `public/sitemap.xml`（`/`, `/tools/cron-jst`, `/tools/jwt-decode` などの主要ルート）

### OGP の仕様と上書き方法

- 既定のメタは `utils/siteMeta.ts` と `app.vue` で一元適用（title/description/canonical/og:image）。
- canonical / og:url / og:image は `NUXT_PUBLIC_SITE_URL` を基準に絶対 URL 化。
- 個別ページでの上書き例（`pages/*.vue` 内）：

```ts
// script setup
import { useSeoMeta } from '#imports'
useSeoMeta({
  title: 'ページ固有タイトル',
  ogTitle: 'ページ固有タイトル',
  description: 'ページ固有の説明',
  ogDescription: 'ページ固有の説明',
  ogImage: `https://kotorilab.jp/api/og/${encodeURIComponent('ページ固有タイトル')}.png`,
})
```

- 動的 OGP: `GET /api/og/[slug].png`（Edge Runtime, `@vercel/og`）。`slug` をタイトルとして描画。
- フォールバック: エラー時は `public/og-default.png` を利用。

### Lighthouse（アクセシビリティ/SEO）

- クイックチェック（デスクトップ、該当カテゴリのみ）:

```bash
pnpm lh:quick
```

- 合格基準（推奨）:

  - Accessibility: 80 以上
  - SEO: 80 以上

- よくある赤項目の是正メモ:
  - `<html lang="ja">` を設定（nuxt.config.ts の `app.head.htmlAttrs.lang`）
  - 適切な `<meta name="description">` を設定（`app.head.meta` または `useSeoMeta`）
  - `<link rel="canonical">` は `app.vue` で自動付与済み（`utils/siteMeta.ts` を参照）
  - 画像 `alt` 欠落のチェック（Nuxt Content 記事やカードの `<img>` に `alt` 指定）

## Deployment (Vercel)

- Import プロジェクト（Root: `./`、Framework: Nuxt Preset）
- Env: `NUXT_PUBLIC_SITE_URL`=本番 URL（`https://kotorilab.jp`（本番） / `https://<project>.vercel.app`（プレビュー））
- ドメイン接続: Vercel で Add Domain → お名前.com の DNS に CNAME/A 設定 → Ready → 環境変数の URL を本番に更新

**Domain & DNS Quick Start**

- Add Domains in Vercel: `kotorilab.jp`（Connect to Production）, `www.kotorilab.jp`（Redirect to kotorilab.jp, Permanent（301/308））
- DNS at registrar:
  - A(@): **216.198.79.1**
  - CNAME(www): **<project-specific>.vercel-dns-XXX.com**
- Set `NUXT_PUBLIC_SITE_URL=https://kotorilab.jp` (Production) and redeploy

## 概要

Tech Site は、開発者向けの Web ツール群を提供する Nuxt 4 ベースのアプリケーションです。Cron 予測ツールは v1.1 仕様に対応し、柔軟なスケジューリングと自動リロード機能を備えています。

## JWT ツール (Beta)

ブラウザのみで動作する JWT Decode / Verify ツールを搭載しています。

### 対応アルゴリズム

- HS256 (HMAC-SHA256)
- RS256 (RSA PKCS#1 v1.5 SHA-256)
- ES256 (P-256 ECDSA, 署名フォーマット一部制限あり)

### 機能一覧

- Header / Payload の即時デコード（ローカル処理）
- 主要 Claims (iss / sub / aud / exp / nbf / iat) のテーブル表示と相対期限表示
- 署名検証 (任意): HS256 シークレット / RS256 / ES256 公開鍵 PEM
- JWKS 取得 (ユーザー明示許可時のみ・既定 OFF・kid マッチ)
- leeway 指定による exp / nbf / iat のゆらぎ許容
- 折りたたみ表示, コピー/クリア, デモ JWT 挿入
- 鍵のドラッグ&ドロップ / 貼り付け入力

### 制限事項

- JWE (暗号化 JWT) 未対応 (4~5 パートは即エラー)
- 巨大 JWT (Header+Payload 合計 > ~200KB) はブラウザ表示パフォーマンス低下の可能性
- ES256: 署名フォーマット (DER vs JOSE compact) 差異補正は最小限
- x5c / 証明書チェーン検証・revocation 未対応

### JWKS について

- デフォルトは取得無効 (外部通信なし)
- チェックボックスを有効化すると指定 URL (例: `https://issuer/.well-known/jwks.json`) から `keys` を取得
- kid 一致 RSA 公開鍵を自動選択し PEM を生成して検証
- 失敗時は `ERR_JWKS_FETCH / ERR_JWKS_INVALID` 等のエラー表示
- キャッシュはメモリ 5 分・「再取得」ボタンで強制更新

### 安全な使い方

1. 本番環境の長期有効アクセストークンは貼らない（テスト用または短期トークン推奨）
2. HS256 シークレットは共有済みのテスト値のみに限定する（機密値をブラウザに貼らない）
3. JWKS を有効化した場合でも 送信されるのは HTTP GET のみで JWT 本文は送信されないことを確認
4. 出力結果のコピー前に秘匿クレーム（email や内部 ID）が含まれないか目視確認する
5. 期限切れ表示は参考値であり、サーバー側検証ロジックが最終的な真実である点を理解する
6. 署名検証に成功しても `aud` / `iss` の期待値確認を忘れない（ツールは任意指定がない限り単純比較のみ）
7. デモ JWT は学習用途専用。実運用向けのセキュリティ評価には使用しない。

### HS256 検証手順 (例)

1. JWT を貼り付け
2. タブを Verify に切替
3. 期待アルゴリズムで HS256 を選択
4. シークレットを入力し「検証」をクリック
5. 緑バッジ「検証成功」表示で署名/Claims が許容範囲内

### RS256 (JWKS) 検証手順 (例)

1. JWT を貼り付け (header に kid が含まれていること)
2. Verify タブで アルゴリズム RS256 を選択
3. 「JWKS を取得して検証」を有効化し URL を指定
4. 「取得」→ 鍵数バッジ確認 → 「検証」
5. 成功時は kid 対応鍵で署名/Claims 検証

### エラーコード概要 (抜粋)

| Code                | 意味                    |
| ------------------- | ----------------------- |
| ERR_ALG_NONE        | alg=none 拒否           |
| ERR_ALG_MISMATCH    | ヘッダ alg と期待不一致 |
| ERR_SIGNATURE       | 署名不一致              |
| ERR_EXPIRED         | exp 期限切れ            |
| ERR_NOT_BEFORE      | nbf 未来未到達          |
| ERR_IAT_FUTURE      | iat 未来時刻            |
| ERR_JWE_UNSUPPORTED | 暗号化 JWT 未対応       |
| ERR_JWKS_FETCH      | JWKS 取得失敗           |
| ERR_JWKS_INVALID    | JWKS 構造不正           |

## クイックスタート

1. リポジトリをクローンし依存関係をインストール
2. 設定ファイルで `dowDomMode`（'OR' または 'AND'）を指定（省略時は 'OR'）
3. サーバー起動後、Cron 予測ツールを利用

## 主要設定

- `dowDomMode`: 'OR'|'AND'（省略時は 'OR'）
- dom: 1–31
- mon: 1–12
- dow: 0–6（0=Sun、7 は未対応）

## リンク

- 詳細な仕様・リリースノートは [PROJECT_SPEC.md](PROJECT_SPEC.md) を参照

---

## ブランド概要（簡易）

- 名称: Tech Site（開発者向けツール＋技術ノート）
- トーン: 簡潔・直接的・実務志向（敬体）
- 色: blue-600 / gray-900 / gray-600 を基調、成功=green、警告=amber、エラー=red
- ロゴ: 当面はテキストロゴ、将来的に `public/logo.svg` を想定

## デプロイ

### 必須環境変数

| 変数名                 | 必須 | 説明                                                              |
| ---------------------- | ---- | ----------------------------------------------------------------- |
| `NUXT_PUBLIC_SITE_URL` | Yes  | 本番ドメイン（末尾スラ無し）。OGP/canonical/robots/sitemap に使用 |

### 手順（Vercel 推奨）

1. Vercel で新規プロジェクト作成（GitHub 連携）
2. 環境変数に `NUXT_PUBLIC_SITE_URL` を設定（Production）
3. ビルドコマンド `pnpm build` / 開始コマンドは Nuxt 既定
4. ドメインを割当（`kotorilab.jp`）。`www`→ ルートへ 301 を推奨

### CI チェック順

```bash
pnpm install
pnpm typecheck
pnpm test -- --run
pnpm build
```

- `pnpm test`（開発） or `pnpm test:run`（CI 相当）

### SEO/公開前チェック

- robots.txt: 本番のみインデックス許可、プレビューは noindex 推奨
- サイトマップ: 初期は静的出力（public/sitemap.xml）。将来 @nuxtjs/sitemap に移行。
- 主要ページの title/description/OGP 確認

- プレビュー（`*.vercel.app`）は `X-Robots-Tag: noindex, nofollow` を送出

### SEO / a11y

- OGP/canonical/robots/sitemap の方針を整備（sitemap は初期は静的出力）
- コントラスト/キーボード操作/aria/ラベルなど a11y を順次強化

## Known limitations

- JWT: JWE は未対応（4~5 パートは即エラー）
- 巨大 JWT はブラウザ表示パフォーマンス低下の可能性

## Tools ヘルプの更新方法（md 編集）

- ページ: `/tools/help`（Nuxt Content で配信）
- ファイル: `content/tools/help.md`
- 手順: 該当の Q&A を Markdown で追記/編集し、PR → マージで本番反映
