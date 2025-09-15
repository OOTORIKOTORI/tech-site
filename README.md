# Tech Site

このプロジェクトには Cron 予測ツールが含まれています（JST/UTC 対応）。以下に Cron 仕様と CSV 仕様を明記します。

## Cron 仕様

- フィールド: `minute hour dom month dow`（crontab 互換の 5 フィールド）
- DOW: `0-6`（`0=Sun`）。`7`は未対応（エラー扱い）。
- DOM × DOW: OR で評価（どちらかが一致すれば通過）。
- 名前トークン: 月は `JAN..DEC`、曜日は `SUN..SAT` をサポート（大文字小文字を無視）。範囲やステップ（例: `JAN-MAR/2`）も可。
- ステップ: `*/n`、`a-b/n` をサポート。`*/0` など 0 以下はエラー。
- タイムゾーン: 計算は JST/UTC を選択可能。JST は固定 +9h オフセットとして扱います。
- 包括開始と切り上げ: 基準時刻に秒・ミリ秒がある場合は「次の分」に切り上げ。ちょうど分の場合は包括。
- 曜日の正規化: `7` は未対応（エラー）。入力に `7` が含まれても `0` として扱いません。

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

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
