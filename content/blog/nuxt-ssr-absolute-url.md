---
title: NuxtでSSR相対URLを禁じる理由（実務目線の最短メモ）
description: SSRで相対URLが招く典型的な不具合と最短の回避策を、Migaki Explorerの運用規約ベースで解説。
tags:
  - nuxt
  - ssr
  - url
  - infra
date: 2025-10-15T00:00:00.000Z
draft: true
audience: フロント/フルスタック開発者（Nuxt SSRの相対URL事故を避けたい人）
type: guide
visibility: hidden
robots: noindex
---

「Nuxt SSR で相対 URL を使ったら本番だけ OG 画像が取れない…」「リンクが 404 になる！」そんな悩みはありませんか？
この記事では、SSR で相対 URL を使うことの落とし穴と、最短の回避策を実務目線で解説します。
まずは関連ツール「SSR チェッカー」で自分の URL を確認してみましょう。

---

## 1. 基本の構造（定義と回避策）

SSR（サーバサイドレンダリング）では、相対 URL を使うと本番環境で不具合が発生しやすくなります。
絶対 URL や ORIGIN 環境変数を使い、`useFetch(ORIGIN + '/api/...')`の形に統一しましょう。

---

## 2. 実例（手順とチェックポイント）

1. 環境変数で ORIGIN を定義します
2. `useFetch(ORIGIN + '/api/...')`の形に統一します
3. CI に smoke:og と postbuild で検知を追加します

---

## 3. 落とし穴（❌ 失敗 →✅ 対策）

- ❌ dev では動いても本番で落ちる
- ✅ 本番環境で必ず検証しましょう
- ❌ preview と prod で挙動が異なる
- ✅ 両方の環境でテストしましょう
- ❌ OG 画像の URL が相対だと取得失敗
- ✅ 必ず絶対 URL で指定しましょう

---

## 4. クイズ

1. SSR で相対 URL を使うと何が起きますか？
2. ORIGIN 環境変数の役割は？
3. smoke:og の目的は？

### 答え

1. 本番で OG 画像やリンクが取得失敗する
2. 絶対 URL を統一して不具合を防ぐ
3. 本番環境で OG 画像取得を自動検知する

---

## 5. まとめ

- SSR では相対 URL を使わず絶対 URL を統一しましょう
- dev/preview/prod で必ず検証しましょう
- CI に smoke:og や postbuild を追加して自動検知しましょう
- 関連ツール「SSR チェッカー」も活用してください

---

まずは「SSR チェッカー」で自分の URL を確認してみましょう。
