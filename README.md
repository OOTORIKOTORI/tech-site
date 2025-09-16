# Tech Site

## Features (v1.1)

- **DOM×DOW Logic**: `dowDomMode: 'OR'|'AND'` (default 'OR')
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
