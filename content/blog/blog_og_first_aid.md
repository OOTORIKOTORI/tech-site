---
title: リンクプレビュー（OG）が出ない時の最初の3手
description: 「画像が出ない / タイトルが違う」を最短で切り分けるための超ミニチェックリスト。
date: 2025-10-08T00:00:00.000Z
audience: コンテンツ担当・開発者（リンクプレビューの不具合を直したい人）
tags:
  - チェックリスト
  - OG
  - 運用
published: true
draft: false
type: guide
visibility: archive
robots: noindex
---
> **この記事はこういう人におすすめ**: （for）
> **この記事で得られること**: （benefits）


SNS やチャットでリンクを貼った時に**画像が出ない / タイトルが違う**。
そんな時にまずやる「3 つだけ」の確認です。1〜3 分想定。

## 用語メモ：OG（Open Graph）とは？

各 SNS やチャットがリンクを展開するときに参照する**メタ情報の総称**です。
代表的な項目は `og:title`（タイトル）, `og:description`（要約）, `og:image`（サムネイル画像）, `og:url`（ページ URL）。
プラットフォームごとに差はありますが、本記事ではこれら**リンクプレビュー用メタ**をまとめて“OG”と呼びます。

## 1) URL は絶対 URL になっている？

- `<meta property="og:image">` / `<meta property="og:url">` は `https://…` の**絶対 URL**で指定。
- ページ内の相対パス（`/og.png` など）が混ざると、環境によって解決に失敗します。

## 2) 画像リソースは 200/302 で取れる？

- 画像 URL を直接開くか、ターミナルで次を実行して確認（例）: `curl -I https://example.com/og-image.png`

- **200 OK** または **302**（フォールバック運用）なら合格。**404/500**は NG。

## 3) キャッシュをリフレッシュ

- 各 SNS のデバッガ（例：Facebook Sharing Debugger / X Card Validator）で**再取得**。
- タイトル・説明・画像の 3 点が期待どおりか目視確認。

---

### よくある原因メモ

- SSR で相対 URL を組み立てている（本番だけ壊れる）。
- 画像の **Content-Type** が `image/*` になっていない。
- `noindex` / 認証ガードの裏に OG 画像を置いている。

### 関連ツール

- **[OG プレビュー確認](/tools/og-check)**: 画像 URL のステータスとリダイレクト連鎖をチェックできます。
- **[サイトマップ / robots チェッカー](/tools/site-check)**: /sitemap.xml と /robots.txt の基本検査を行えます。

ツールで即チェックできます。

_更新履歴: 2025-10-08 初版（OG 説明を追記／関連ツールは準備中表記）_
