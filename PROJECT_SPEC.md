# プロジェクト仕様書 - Tech Site

## 📋 プロジェクト概要

### プロジェクト名

**Tech Site** - 開発者向けツールサイト

### 概要

開発に役立つ Web ツールを提供する Nuxt 4 ベースの Web アプリケーションです。多くの処理はクライアントサイド（ブラウザ内）で実行可能で、プライバシーとセキュリティを考慮した設計になっています。

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
