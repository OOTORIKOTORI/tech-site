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
> **この記事はこういう人におすすめ**: （for）
> **この記事で得られること**: （benefits）


## 結論（最短）

- SSR は**相対 URL を使わない**。`useFetch` + 絶対 URL or ORIGIN 環境変数。
- 失敗例は、**本番だけ OG 画像が取れない/リンクが相対で 404**など。CI の postbuild と smoke:og で検知を仕込む。

## 手順（最小差分）

1. 環境変数で ORIGIN を定義
2. `useFetch(ORIGIN + '/api/...')` の形に統一
3. CI に smoke:og と postbuild で検知を追加

## よくある誤解

- dev は動いても本番で落ちる
- preview と prod で挙動が異なる
- OG 画像の URL が相対だと取得失敗

## 付録：チェックリスト

- [ ] dev/preview/prod で相対 URL が残っていない
- [ ] smoke:og が 200/302
- [ ] LHCI グリーン
