---
title: PWA Manifest入門：インストール可能なWebアプリの設定ガイド
description: '課題: manifest.json の設定ミスで PWA がインストールできない。得られること: 必須フィールド、推奨設定、検証方法の基本。'
date: '2025-11-01'
tags:
  - 'tool:pwa-checker'
  - 入門
  - pwa
  - web
  - manifest
audience: フロントエンド開発者
type: primer
tool: pwa-checker
visibility: primer
robots: index
---

「PWA を作ったのにスマホにインストールできない…」「manifest.json の設定項目が多すぎて何が必須か分からない！」そんな悩みはありませんか？
この記事では、PWA manifest の基本、必須フィールドと推奨設定、よくある落とし穴・対策を短時間で解説します。
まずは関連ツール「PWA Manifest Checker」で自分のサイトをチェックしてみましょう。

---

## 1. 基本の構造（manifest.json とは）

**PWA Manifest** は、Web アプリをネイティブアプリのようにインストール可能にするための JSON 設定ファイルです。
アイコン、名前、表示モード、テーマカラーなどを定義します。

### 最小構成の例

```json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 2. 必須フィールドと推奨設定

| フィールド         | 必須/推奨 | 説明                                        | 例                          |
| ------------------ | --------- | ------------------------------------------- | --------------------------- |
| `name`             | 必須      | アプリの正式名称                            | "My Progressive Web App"    |
| `short_name`       | 推奨      | ホーム画面に表示される短縮名（12 文字以内） | "MyApp"                     |
| `start_url`        | 推奨      | アプリ起動時の URL                          | "/" または "/index.html"    |
| `display`          | 推奨      | 表示モード                                  | "standalone" (推奨)         |
| `theme_color`      | 推奨      | ツールバーの色                              | "#4285f4"                   |
| `background_color` | 推奨      | スプラッシュ画面の背景色                    | "#ffffff"                   |
| `icons`            | 必須      | アイコン画像の配列                          | 192×192 と 512×512 を含める |

### display モードの種類

| モード       | 説明                           | 使用例                           |
| ------------ | ------------------------------ | -------------------------------- |
| `fullscreen` | 全画面表示（ブラウザ UI なし） | ゲーム、没入型コンテンツ         |
| `standalone` | 独立アプリ風（推奨）           | 一般的な Web アプリ              |
| `minimal-ui` | 最小限の UI（戻る・進む等）    | ブラウザライクな体験が必要な場合 |
| `browser`    | 通常のブラウザ表示             | PWA 化しない場合                 |

---

## 3. アイコンサイズの推奨設定

PWA として正しく機能するには、複数サイズのアイコンが必要です。

| サイズ  | 重要度 | 用途                  |
| ------- | ------ | --------------------- |
| 192×192 | 必須   | Android ホーム画面    |
| 512×512 | 必須   | スプラッシュ画面      |
| 144×144 | 推奨   | Windows タイル        |
| 96×96   | 推奨   | Chrome Web Store      |
| 72×72   | 任意   | 古い Android デバイス |
| 48×48   | 任意   | アイコン縮小時の予備  |

**ポイント**: 512×512 は高解像度画面用に必須です。

---

## 4. 実例（manifest.json の設置手順）

### ステップ 1: manifest.json を作成

```json
{
  "name": "Migaki Explorer",
  "short_name": "Migaki",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4285f4",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### ステップ 2: HTML で manifest をリンク

```html
<link rel="manifest" href="/manifest.json" />
```

### ステップ 3: Service Worker を登録（任意だが推奨）

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

---

## 5. 落とし穴（❌ 失敗 →✅ 対策）

### HTTPS 必須

- ❌ HTTP でホストして PWA がインストールできない
- ✅ HTTPS 環境でホストしましょう（localhost は例外で OK）

### アイコンサイズ不足

- ❌ 192×192 のみで、スプラッシュ画面が表示されない
- ✅ 192×192 と 512×512 を必ず含めましょう

### start_url の相対パス間違い

- ❌ start_url が `/app/` なのに、ルートに manifest を置いてエラー
- ✅ start_url はドキュメントルートからの絶対パスで指定しましょう

### name と short_name の使い分け

- ❌ short_name を省略して、長い名前がホーム画面で切れる
- ✅ short_name は 12 文字以内に収めましょう

### display モードの誤解

- ❌ `browser` モードで PWA 化したつもりになる
- ✅ `standalone` を推奨。`browser` は通常のブラウザ表示です

---

## 6. 手を動かす（3 手で検証）

1. [PWA Manifest Checker](/tools/pwa-checker) にアクセスします
2. あなたのサイトの URL を入力します
3. 検証結果を確認し、欠落フィールドやアイコンサイズの問題を修正します

**試してみよう**:

- 有名な PWA サイト（Twitter、Instagram）を検査して、推奨設定を学ぶ
- 自分のサイトで意図的に manifest を不完全にして、エラーメッセージを確認

---

## 7. PWA の動作確認方法

### Chrome DevTools で確認

1. DevTools を開く（F12）
2. **Application** タブ → **Manifest** セクション
3. エラーや警告をチェック
4. **Add to Home Screen** ボタンで動作確認

### Lighthouse でスコア確認

1. DevTools → **Lighthouse** タブ
2. **Progressive Web App** カテゴリを選択
3. スコアと改善提案を確認

---

## 8. クイズ

1. PWA に必須のアイコンサイズを 2 つ挙げてください
2. `display: "browser"` と `display: "standalone"` の違いは？
3. HTTPS なしで PWA をインストールできる例外は？

### 答え

1. 192×192 と 512×512
2. `browser` は通常のブラウザ表示、`standalone` は独立アプリ風の全画面表示
3. localhost のみ

---

## 9. まとめ

- PWA Manifest は Web アプリをインストール可能にする JSON 設定ファイル
- 必須: `name`, `icons`（192×192, 512×512）
- 推奨: `short_name`, `start_url`, `display: "standalone"`, `theme_color`, `background_color`
- HTTPS 環境でホストが必須（localhost は例外）
- Chrome DevTools や Lighthouse で動作確認しましょう
- 「PWA Manifest Checker」で設定を検証しましょう
- 実際に手を動かして、自分のサイトを PWA 化しましょう

---

まずは「PWA Manifest Checker」で自分のサイトをチェックしてみましょう。
→ [PWA Manifest Checker](/tools/pwa-checker)
