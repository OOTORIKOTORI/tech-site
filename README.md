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
https://tech-site-docs.com/tools/cron-jst?expr=0+9+*+*+1&n=10&tz=Asia%2FTokyo&rel=now
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

## 概要

Tech Site は、開発者向けの Web ツール群を提供する Nuxt 4 ベースのアプリケーションです。Cron 予測ツールは v1.1 仕様に対応し、柔軟なスケジューリングと自動リロード機能を備えています。

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
