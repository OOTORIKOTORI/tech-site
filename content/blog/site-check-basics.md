---
title: サイトチェッカー入門：meta タグと構造化データの健康診断
description: '課題: meta/canonical/JSON-LD/robots/sitemap/feed の健全性が分からない。得られること: 点検観点・一括確認手順。'
date: 2025-10-22T00:00:00.000Z
published: true
audience:
  - 初学者
  - Web エンジニア
tags:
  - 'tool:site-check'
  - seo
  - meta
type: primer
tool: site-check
visibility: primer
robots: index
---

「SEO の健康診断って何を見るの？」という疑問に、まず押さえたい項目をコンパクトにまとめます。

---

## 1. 導入：よくある悩み・初心者の疑問

- meta description が空のページが混ざっている
- canonical が自己参照でない・重複 URL が整理されていない
- robots.txt / sitemap.xml / feed.xml の到達性が曖昧
- JSON-LD（構造化データ）が入っているが正しいか分からない

  「SEO の健康診断って何を見ればいいか分からない…」「meta や canonical の設定が不安！」そんな悩みはありませんか？
  この記事では、meta タグと構造化データの健康診断の基本と、よくある落とし穴・対策、確認手順を短時間で解説します。
  まずは関連ツール「サイトチェッカー」で自分のページをまとめてチェックしてみましょう。

  ***

  ## 1. 基本の構造（定義と観点）

  meta タグはページ要約、canonical は正規 URL 宣言、robots.txt はクロール制御、JSON-LD は検索結果のリッチ化に寄与します。

  | 項目       | 役割          |
  | ---------- | ------------- |
  | meta       | ページ要約    |
  | canonical  | 正規 URL 宣言 |
  | robots.txt | クロール制御  |
  | JSON-LD    | 構造化データ  |

  ***

  ## 2. 実例（確認手順）

  1. HTTP ステータス/ヘッダーを確認します（200/301/302、noindex/redirect の有無）
  2. HTML ヘッドの meta/canonical を点検します
  3. robots.txt でサイトマップの場所を確認します
  4. sitemap.xml で URL の到達性と正規性を確認します
  5. JSON-LD はリッチリザルトテストで検証します

  ***

  ## 3. 落とし穴（❌ 失敗 →✅ 対策）

  - ❌ canonical が相対 URL になっている
  - ✅ 必ず絶対 URL で指定しましょう
  - ❌ 記事の重複（パラメータ/カテゴリ/タグ）
  - ✅ canonical で一本化しましょう
  - ❌ JSON-LD の型/プロパティ不足
  - ✅ 必要な型・プロパティを追加しましょう
  - ❌ robots.txt の Disallow で必要ページまで塞いでしまう
  - ✅ 必要なページは必ず許可しましょう

  ***

  ## 4. クイズ

  1. canonical タグはなぜ絶対 URL で指定すべき？
  2. JSON-LD の役割は？
  3. robots.txt で Disallow しすぎると何が起きる？

  ### 答え

  1. 解釈の不安定さを防ぐため
  2. 検索結果のリッチ化に寄与する
  3. 必要なページまで検索エンジンに塞がれてしまう

  ***

  ## 5. まとめ

  - meta/canonical/robots/JSON-LD は SEO の健康診断に必須です
  - canonical は必ず絶対 URL で指定しましょう
  - JSON-LD は型・プロパティを十分に設定しましょう
  - robots.txt は必要なページを許可しましょう
  - 関連ツール「サイトチェッカー」も活用してください

  ***

  まずは「サイトチェッカー」で自分のページをまとめてチェックしてみましょう。

- `title` / `meta[name=description]` — ページ要約
- `link[rel=canonical]` — 正規 URL の宣言（重複 URL を統一）
- `meta[name=robots]` / `robots.txt` — 掲載可否・クロール制御
- `application/ld+json` — 構造化データ（JSON-LD）で検索結果のリッチ化に寄与

---

## 3. 仕組み・構造：確認の流れ

1. HTTP ステータス/ヘッダー確認（200/301/302、noindex/redirect の有無）
2. HTML ヘッドの meta/canonical を点検
3. robots.txt → サイトマップの場所を確認
4. sitemap.xml → URL の到達性と正規性を確認
5. JSON-LD → [リッチリザルトテスト](https://search.google.com/test/rich-results)で検証

---

## 4. よくあるつまずき／勘違い

- canonical が相対 URL → 解釈が不安定（原則絶対 URL）
- 記事の重複（パラメータ/カテゴリ/タグ） → canonical で一本化
- JSON-LD の型/プロパティ不足 → 検索結果に反映されない
- robots.txt の`Disallow`で必要ページまで塞いでしまう

---

## 5. 実例：具体的に使う場面

- リニューアル直後の**一括到達性チェック**
- メタ情報の**テンプレート化**（Nuxt/Next で共通設定）
- 重要 LP/記事の**定期ヘルスチェック**（週次など）

---

## 6. セキュリティ・運用上の注意

- ステージングは`noindex`を徹底（公開前のインデックス防止）
- 301/302 の誤用に注意（恒久移転は 301）
- PII（個人情報）の JSON-LD 埋め込みは避ける

---

## 7. 手を動かす：関連ツール `/tools/site-check` の紹介

- [/tools/site-check](/tools/site-check) にアクセス
- ORIGIN を確認 → 「まとめてチェック」を実行
- robots / sitemap / feed の到達性、サンプル URL、ORIGIN 一致を確認

---

## 8. 3 分クイズ

- canonical の役割は？ → 重複 URL の統一
- JSON-LD は何のため？ → 構造化データで検索結果の理解とリッチ表示に寄与
- robots と noindex の違いは？ → クロール制御とインデックス制御

<details>
<summary>クイズ（3問）</summary>

1. canonical は相対 URL で良い？ → いいえ、原則絶対 URL
2. robots.txt に Sitemap 行を書く効果は？ → クローラにサイトマップ URL を通知
3. noindex を設定すべきページ例は？ → 検索不要のダッシュボード等

</details>

---

## 9. 関連リンク

- 構造化データガイド: https://developers.google.com/search/docs/appearance/structured-data
- リッチリザルトテスト: https://search.google.com/test/rich-results
- robots.txt: https://developers.google.com/search/docs/crawling-indexing/robots/intro

> 関連ツール: [/tools/site-check](/tools/site-check)
