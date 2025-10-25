---
title: Linux topの読み方：現場チートシート
description: 'Load, CPU%, Mem/Swap を最短で読むための実務メモ。'
tags:
  - linux
  - top
  - ops
date: 2025-10-15T00:00:00.000Z
draft: true
audience: Linuxサーバの運用担当・SRE（topで一次切り分けしたい人）
type: guide
visibility: hidden
robots: noindex
---
> **この記事はこういう人におすすめ**: （for）
> **この記事で得られること**: （benefits）


## まずは見る場所

- 1 行目: load average（1/5/15 分）= 直近の平均同時実行数。コア数を超えると待ちが発生しやすい。
- CPU 欄: `us`(ユーザ), `sy`(システム), `id`(アイドル), `wa`(I/O 待ち)。`wa`が高い=ディスク待ち疑い。

## すぐ使う判断基準

- Load > 物理/論理コア数が継続ならボトルネック要調査（I/O/CPU/スレッド）。

## よくある誤読

- `wa` は CPU が I/O 完了待ちで遊んでいる状態。ディスク/ネットワークの遅延を疑う。
