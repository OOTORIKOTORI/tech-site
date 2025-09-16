# プロジェクト仕様書 - Tech Site

## 📋 プロジェクト概要

### プロジェクト名

**Tech Site** - 開発者向けツールサイト

### サイト概要

本サイトは「便利ツール＋技術ブログ」の開発者向け情報サイトです。
ツールはブラウザ完結を基本とし、記事は実務 SE 向けナレッジを中心に配信します。

---

### ビジネスモデル

- ウェブ公開を前提に広告収益（ディスプレイ/コンテンツ連動）を主軸とします。
- 将来的な収益多角化（スポンサー/アフィ/有料ノート/寄付等）の可能性も明記します。

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

---

### 法務/ポリシー（骨子）

- プライバシーポリシー/クッキーポリシー/広告に関する記載（例: 第三者配信の Cookie 使用）を別ページに整備予定。
- ads.txt の配置（後日導入時）。具体的な広告コードは本仕様からは除外し、運用手順のみ記載。

---

### ナビゲーション

- ヘッダ: Tools / Blog / About / Privacy
- フッタ: プライバシー/利用規約/問い合わせ

### 主要機能

- **JWT Decoder**: JSON Web Token のデコードツール
- **Cron JST 予測**: crontab 形式のスケジュールから日本時間での次回実行時刻を予測

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
