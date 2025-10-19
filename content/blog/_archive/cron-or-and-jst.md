---
benefits: ""
for: ""
audience: ["初心者","中級者"]
title: 'cron の DOM×DOW は OR か AND か？JST 運用の落とし穴'
description: 'crontab の DOM×DOW（AND/OR）仕様と JST 運用の注意点、失敗例・対策を解説。'
date: '2025-09-16'
published: false
robots: 'noindex,follow'
tags:
  - cron
  - JST
  - AND
  - OR
  - 運用
  - internal
  - archived
---

**対象読者**: crontab の DOM/DOW を使い分ける SRE/開発者、CI 運用担当。

**この記事で得られること**: DOM×DOW の評価論理（OR/AND）の違いと、JST 運用時の検証のコツ・安全策が分かります。

## 背景

多くのエンジニアが「\* \* \* \* \*」のような cron 式を使いますが、DOM と DOW を同時指定した場合の動作は一筋縄ではいきません。

## OR と AND

- OR: DOM または DOW どちらかが一致すれば実行
- AND: DOM も DOW も両方一致したときだけ実行

## '\*'の扱い（言語指定付きのコード例）

例えば `0 0 1 * 0` のような式で、DOM=1, DOW=0（=日曜）を指定した場合、OR なら「毎月 1 日と毎週日曜」、AND なら「1 日が日曜のときのみ」実行されます。

```text
0 0 1 * 0  # 毎月1日と毎週日曜（OR）/ 1日が日曜のみ（AND）
```

## 具体例

JST と UTC の境界で日付や曜日判定がズレるケースがあるため、実環境の TZ 基準を確認し、必要に応じて UTC 固定で設計・検証します。

## 失敗例と対策

JST 運用で「1 日が日曜以外も動いてしまった」などの事故が多発します。必ず仕様を確認し、[Cron JST ツール](/tools/cron-jst)で検証しましょう。

## まとめ

cron の DOM×DOW 仕様は要注意。JST 運用では特に検証を！

## 関連リンク

- 内部: [Cron JST ツール](/tools/cron-jst)
- 外部: [crontab(5) — Linux man-pages](https://man7.org/linux/man-pages/man5/crontab.5.html)
