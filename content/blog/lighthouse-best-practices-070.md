---
title: Lighthouse Best Practices 0.70を守るコツ（AdSenseと共存）
description: 広告を入れつつBest Practices >= 0.70を安定させるための最小ルールと落とし穴。
tags:
  - lighthouse
  - adsense
  - webperf
date: 2025-10-15T00:00:00.000Z
draft: true
audience: サイト運用・開発者（広告と品質スコアを両立したい人）
type: guide
visibility: hidden
robots: noindex
---
> **この記事はこういう人におすすめ**: （for）
> **この記事で得られること**: （benefits）


## 結論（最短）

- 閾値は **best-practices ≥ 0.70**。広告は**本番のみ SSR 挿入**。

## 実務ルール

- script は **1 本だけ**・重複防止キーを付与
- 収集は本番 200 待ち → 失敗 1 リトライ
- a11y≥90 は継続運用

## よくあるつまずき

- Preview で広告を出してしまう
- 広告スクリプトの重複読み込み
- best-practices のスコアが不安定

## 付録：チェックリスト

- [ ] 広告は本番のみ挿入
- [ ] スクリプトの重複がない
- [ ] LHCI best-practices ≥ 0.70
- [ ] LHCI a11y ≥ 90
