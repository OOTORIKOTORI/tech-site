---
title: Epoch Timestamp Converter の基礎
description: Epoch（Unix時間）と日時（JST/UTC）の基本と、秒/ミリ秒の違いを短く解説。
tags:
  - epoch
  - timestamp
  - date
  - timezone
  - jst
  - utc
  - tools
audience: 開発・運用
published: false
visibility: hidden
robots: noindex
---

本記事はツール「Epoch Timestamp Converter」の短い使い方ガイドです。公開前のメモ（下書き）。

## 何ができる？

- Epoch（Unix 時間）⇄ 日時の双方向変換
- タイムゾーンは JST / UTC を切替
- 秒（10 桁）/ ミリ秒（13 桁）は自動判定または手動指定

## 使い方

1. Epoch 値（例: `1700000000` または `1700000000000`）を入力すると、JST/UTC の日時が表示されます。

「Unix 時間（Epoch）と日時の変換が分かりにくい…」「JST と UTC の違いで混乱する！」そんな悩みはありませんか？
この記事では、Epoch Timestamp Converter の基本と使い方、よくある落とし穴・対策を短時間で解説します。
まずは関連ツール「Timestamp Converter」で自分の値を変換してみましょう。

---

## 1. 基本の構造（定義と観点）

Epoch（Unix 時間）は、1970 年 1 月 1 日からの経過秒数（またはミリ秒）です。
タイムゾーンは JST（日本標準時）と UTC（協定世界時）を切り替えできます。

---

## 2. 実例（使い方手順）

1. Epoch 値（例: `1700000000`や`1700000000000`）を入力します
2. JST/UTC の日時が表示されます
3. 逆に日時（`YYYY-MM-DDTHH:mm`）を入力すると、Epoch（秒/ミリ秒）が得られます

---

## 3. 落とし穴（❌ 失敗 →✅ 対策）

- ❌ 秒（10 桁）とミリ秒（13 桁）を混同する
- ✅ 桁数で自動判定、または手動指定しましょう
- ❌ JST と UTC の切替を忘れる
- ✅ 必要に応じてタイムゾーンを切り替えましょう

---

## 4. クイズ

1. Epoch（Unix 時間）は何を表しますか？
2. JST と UTC の違いは？
3. 秒とミリ秒の判定方法は？

### 答え

1. 1970 年 1 月 1 日からの経過秒数（またはミリ秒）
2. 日本標準時と協定世界時の違い
3. 桁数で判定（10 桁=秒、13 桁=ミリ秒）

---

## 5. まとめ

- Epoch と日時の変換は桁数とタイムゾーンに注意しましょう
- JST/UTC の切替を忘れずに
- 関連ツール「Timestamp Converter」も活用してください

---

まずは「Timestamp Converter」で自分の値を変換してみましょう。
