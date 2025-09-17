# プロジェクト仕様書 - KOTORI Lab

## 📋 プロジェクト概要

### プロジェクト名

**KOTORI Lab** - 開発者向けツールサイト

### サイト概要

本サイトは「便利ツール＋技術ブログ」の開発者向け情報サイトです。
ツールは完全ローカルでの処理（ブラウザ完結）を重視し、記事は実務 SE 向けナレッジを中心に配信します。
公開ドメイン: https://kotorilab.jp

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

- Vercel での CD（自動デプロイ）を採用し、`NUXT_PUBLIC_SITE_URL` は本番独自ドメインを必須（例: https://kotorilab.jp）。
- robots.txt / sitemap.xml は初期は静的出力。

---

### 法務/ポリシー（骨子）

- プライバシーポリシー/クッキーポリシー/広告に関する記載（例: 第三者配信の Cookie 使用）を別ページに整備予定。
- ads.txt の配置（後日導入時）。具体的な広告コードは本仕様からは除外し、運用手順のみ記載。

---

### ナビゲーション

- ヘッダ: Tools / Blog / About / Privacy / Terms / Ads（雛形ページ、順次整備）
- フッタ: プライバシー/利用規約/広告/問い合わせ（雛形ページ、順次整備）

### 主要機能

- **JWT Decoder**: JSON Web Token のデコードツール（パス: `/tools/jwt-decode`）
- **Cron JST 予測**: crontab 形式のスケジュールから日本時間での次回実行時刻を予測（パス: `/tools/cron-jst`）

---

## 🏗️ 技術スタック

### バージョン

- v1.1

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

## ⚙️ 主要設定

- `nuxt.config.ts`: Nuxt.js の設定ファイル
- `tailwind.config.ts`: Tailwind CSS の設定ファイル
- `scheduler.tickSeconds`: 10（自動再読込の間隔）
- `scheduler.dowDomMode`: 'OR'|'AND'（省略時 'OR'）
- **Auto-reload**: configVersion/settingsUpdatedAt 変化 → 次 tick で再読込、in-flight 継続

## 🔗 リンク

- [GitHub リポジトリ](https://github.com/OOTORIKOTORI/tech-site)
- [ドキュメント](https://tech-site-docs.com)

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。

---

## v1.1 仕様

- **DOM×DOW は dowDomMode ('OR'|'AND') で切替。'\*' は OR=unrestricted / AND=always-true。**
- **'\*' の解釈**: OR=制限なし（片方が '\*' ならもう片方のみ判定）/ AND=常時 true と等価。
- **値域**: `dow=0–6（0=Sun）, 7非対応`, **名前トークン未対応**。dom=1–31, mon=1–12。
- **Auto-reload**: tick=10s、`configVersion`/`settingsUpdatedAt` 変化 →**次の tick**再読込、in-flight 継続。
- **互換性**: `dowDomMode` 未指定時は OR 互換。

---

## 🏗️ 技術スタック

- **フレームワーク**: Nuxt 4
- **言語**: TypeScript
- **テスト**: Vitest
- **スタイリング**: Tailwind CSS

---

## 📅 リリースノート

- **v1.0**: 初期リリース
- **v1.1**: DOM×DOW 切替（dowDomMode）とドキュメント整備
- **v1.2（予定）**: 独自ドメイン切替とメタ/OGP 整理

---

## 🎨 ブランドガイド（最小版）

- サイト名: 「KOTORI Lab」
- トーン&マナー: 直接的・簡潔・実務志向（敬体、日本語）
- カラー（Tailwind 参照目安）
  - プライマリ: `blue-600`（アクセント/リンク）
  - テキスト: `gray-900` / 補助: `gray-600`
  - 成功: `green-600` / 警告: `amber-600` / エラー: `red-600`
- タイポグラフィ: デフォルト（システム UI）/ 等幅領域に `font-mono`
- ロゴ: 文字ロゴ（当面）。将来的に SVG ロゴを `public/logo.svg` に配置予定（未実装）
- アセット: `public/favicon.ico` 既存。OGP 既定画像は今後 `public/og-default.png` を想定（未配置）

備考: 実装と乖離しないよう、配色/コンポーネントは Tailwind ユーティリティを優先して統一。

---

## 🚢 デプロイ & ドメイン/SEO 方針

### ホスティング

- 推奨: Vercel（Node 18+ / pnpm）。ビルドコマンド `pnpm build`、出力 `.output` / Nuxt 4 既定。

### 環境変数（重要）

- `NUXT_PUBLIC_SITE_URL`（必須/本番）: 例 `https://tech-site-docs.com`（末尾スラッシュ無し）
  - OGP/canonical/robots/sitemap の基準 URL。未設定だと既定 `http://localhost:3000` を使用。

### ドメイン

- ルートドメイン例: `tech-site-docs.com`
- 推奨設定: `www` → ルートへ 301 リダイレクト（Vercel の Domain 設定でエイリアス/リダイレクト）
- TLS: Vercel 自動証明書に委任

### SEO/クローラ

- `public/robots.txt` あり（既定 allow）。本番のみインデックス許可、プレビューは noindex を推奨
  - 運用上の選択肢: プレビュー URL へ `x-robots-tag: noindex` を付与（Vercel ヘッダ設定）
- サイトマップ: `@nuxtjs/sitemap` を導入済み（`nuxt.config.ts` でドメイン設定とパス除外を調整）
- 構造化データ: 記事/ツールページで JSON-LD を段階導入（別タスク）

### CI/CD（チェック順）

1. Install: `pnpm install`
2. 型: `pnpm typecheck`
3. テスト: `pnpm test -- --run`
4. ビルド: `pnpm build`

### リリース運用

- `main` → Production、PR → Preview を Vercel で自動化
- リリース前チェックリスト
  - [ ] `NUXT_PUBLIC_SITE_URL` を本番環境に設定
  - [ ] すべてのテスト green（JWT/cron）
  - [ ] 主要ページの meta/OGP/リンク確認
  - [ ] robots/sitemap の想定どおり挙動
  - [ ] 広告を有効化する場合はポリシー/ads.txt/同意導線の準備
