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
type: primer
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
2. 逆に、日時を入力（`YYYY-MM-DDTHH:mm`）すると、Epoch（秒/ミリ秒）が得られます。

注意: 入力はすべてブラウザ内で処理され、サーバーへ送信されません。

## 関連リンク

- ツール: /tools/timestamp
