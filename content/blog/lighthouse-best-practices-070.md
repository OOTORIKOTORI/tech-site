---
title: Lighthouse Best Practices 0.70を守るコツ（AdSenseと共存）
description: 広告を入れつつBest Practices >= 0.70を安定させるための最小ルールと落とし穴。
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

「広告を入れると Lighthouse の Best Practices スコアが下がる…」「SSR で広告を出すと本番だけ不具合？」そんな悩みはありませんか？
この記事では、広告と品質スコアを両立するための最小ルールと、よくある落とし穴・対策を短時間で解説します。
まずは関連ツール「Lighthouse Checker」で自分のサイトをチェックしてみましょう。

---

## 1. 基本のルール（定義と構文）

Lighthouse Best Practices は、Web サイトの品質を測る指標です。
広告を入れる場合は「本番のみ SSR で挿入」「script は 1 本だけ」「重複防止キーを付与」などが重要です。

| 項目           | ポイント                       |
| -------------- | ------------------------------ |
| Best Practices | 0.70 以上を目指す              |
| SSR 広告       | 本番のみ挿入、Preview は非表示 |
| script 管理    | 1 本だけ、重複防止キーを付与   |

---

## 2. 実例（よく使う判断基準）

Best Practices >= 0.70、a11y >= 90 を安定して維持するには、広告の挿入タイミングと script 管理が重要です。
本番以外で広告を出すとスコアが不安定になるため注意しましょう。

---

## 3. 落とし穴（❌ 失敗 →✅ 対策）

- ❌ Preview で広告を出してしまう
- ✅ 本番のみ SSR で広告を挿入し、Preview では非表示にします
- ❌ script の重複読み込み
- ✅ script は 1 本だけ、重複防止キーを必ず付与します
- ❌ Best Practices スコアが不安定
- ✅ 本番環境でのみ計測し、a11y も 90 以上を維持しましょう

---

## 4. 手を動かす（3 手で検証）

1. Lighthouse Checker で自分のサイトを計測します
2. Best Practices と a11y のスコアを確認します
3. 広告の挿入タイミングと script 管理を見直します

---

## 5. クイズ

1. Best Practices スコアが下がる主な原因は？
2. SSR で広告を挿入する際の注意点は？
3. script の重複を防ぐ方法は？

### 答え

1. 広告の挿入タイミングや script の重複
2. 本番のみ SSR で挿入し、Preview では非表示にする
3. script は 1 本だけ、重複防止キーを付与する

---

## 6. まとめ

- Best Practices >= 0.70、a11y >= 90 を目指しましょう
- 広告は本番のみ SSR で挿入します
- script は 1 本だけ、重複防止キーを付与します
- スコアが不安定な場合は挿入タイミングを見直しましょう
- 関連ツール「Lighthouse Checker」も活用してください

---

まずは「Lighthouse Checker」で自分のサイトをチェックしてみましょう。

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
