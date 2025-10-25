---
title: Linux top 入門：負荷を読み解くための指標ガイド
description: '課題: top の指標の意味が曖昧で原因に辿り着けない。得られること: 指標の読み方・初動の当たりの付け方。'
date: 2025-10-22T00:00:00.000Z
published: true
audience:
  - 初学者
  - Web エンジニア
tags:
  - 'tool:top-analyzer'
  - linux
  - infra
  - performance
type: primer
tool: top-analyzer
visibility: primer
robots: index
---

サーバが「重い」と感じたとき、まず開くのが `top`。でも数字の意味が曖昧だと、原因に辿り着けません。
本記事では、`top`の主要指標の意味と、初動の当たりを付ける読み方をまとめます。

---

## 1. 導入：よくある悩み・初心者の疑問

- load average が高いと何が起きている？
- CPU% が高い＝常に悪？ I/O 待ちって何？
- メモリ使用率が高いが、どこから手を付けるべき？

---

## 2. そもそも定義：top の基本

`top`は**瞬間的なシステム状態**を表示するコマンド。CPU・メモリ・プロセスの情報から、負荷の原因に目星を付けます。

- load average: 実行/待機中のプロセス数の平均（1,5,15 分）
- CPU%: ユーザ時間（us）/システム時間（sy）/優先度（ni）/アイドル（id）/I/O 待ち（wa）など
- MEM%: 使用メモリ量とキャッシュ/バッファの関係

---

## 3. 仕組み・構造：指標のつながり

- load average が高い → CPU 待ち or I/O 待ちのプロセスが多い
- CPU の`us`が高い → 計算が重い（アプリの CPU 最適化）
- CPU の`wa`が高い → I/O ボトルネック（ディスク/ネットワーク）
- MEM が逼迫 → スワップ発生で全体が遅くなる

---

## 4. よくあるつまずき／勘違い

- load average は「CPU 使用率」ではない（待ち行列の混み具合の指標）
- `ni`（nice）は優先度調整で、直接の負荷の大きさではない
- キャッシュはメモリ消費に見えるが、実際には再利用のための余地

---

## 5. 実例：ボトルネック診断のヒント

- `us`高 + 単一プロセス支配 → 該当プロセスの CPU 最適化（アルゴリズム/スレッド化）
- `wa`高 + ディスク I/O 多 → ストレージ性能/クエリ最適化/バッチ分割
- MEM 逼迫 + スワップ → メモリリーク/キャッシュ設定/コンテナ制限

---

## 6. セキュリティ・運用上の注意

- 本番での継続`top`監視は最小限（リソース消費・SSH セッション管理）
- 収集ログに機密情報は含めない（パス・引数など）

---

## 7. 手を動かす：関連ツール `/tools/top-analyzer` の紹介

- `top -b -d 5 -n 1000 > top_YYYYmmdd.log` などでログ取得
- [/tools/top-analyzer](/tools/top-analyzer) に読み込む → CPU/Load/Mem の推移とプロセス傾向を可視化
- 解析 CSV をダウンロードして、事後分析や共有に活用

---

## 8. 3 分クイズ

- load average が高い時、まず疑うのは？ → CPU or I/O の待ち
- `us` と `wa` の違いは？ → 前者は計算、後者は I/O 待ち
- MEM 逼迫の兆候は？ → スワップ・キャッシュの挙動

<details>
<summary>クイズ（3問）</summary>

1. load average は CPU 使用率？ → いいえ、待機中も含む平均実行要求数
2. IOWAIT が高い時の対処は？ → ストレージ/クエリ/バッチの最適化
3. 1 分/5 分/15 分のどれを見る？ → ピークと傾向の両方（短期/中期）

</details>

---

## 9. 関連リンク

- `top` man: https://man7.org/linux/man-pages/man1/top.1.html
- sar/iostat/vmstat: 複合的な観測で原因を絞り込む

> 関連ツール: [/tools/top-analyzer](/tools/top-analyzer)
