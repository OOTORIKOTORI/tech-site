---
benefits: ""
for: ""
audience: ["初心者","中級者"]
title: 'JavaScriptの日時とタイムゾーン超入門（getDayがズレる理由）'
description: 'JSのDate/Intl/timeZoneの基礎と、getDayがズレる典型原因を解説。Intlでの表示TZ明示や、テストをTZ非依存にする実践的な手順も紹介し、環境差による不具合を防ぎます。'
date: '2025-09-16'
published: false
robots: 'noindex,follow'
tags:
  - JavaScript
  - Date
  - TimeZone
  - getDay
  - テスト
  - JST
  - UTC
  - internal
  - archived
---

JavaScript で日時を扱うとき、タイムゾーンの違いで「getDay()」の値がズレることがあります。なぜでしょう？

**対象読者**: JS で日時/曜日を扱うフロント/バックエンド開発者、テスト整備担当。

**この記事で得られること**: getDay のズレが起きる仕組みと、Intl/timeZone 指定、テストの TZ 固定手法が分かります。

## 用語ミニ辞典（簡易）

- ローカルタイムゾーン: 実行環境の既定 TZ。Date はこれに依存
- UTC: 協定世界時。テスト固定やログ基準に便利
- Intl.DateTimeFormat: 任意 TZ での表示を実現する API

## Date の基礎

Date オブジェクトは常に「ローカルタイムゾーン」を基準に動作します。

## Intl+timeZone

`Intl.DateTimeFormat`を使うと、任意のタイムゾーンで日時を表示できます。

```js
const d = new Date('2025-09-16T00:00:00Z')
const fmt = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' })
console.log(fmt.format(d)) // JSTでの曜日
```

## UTC と JST

UTC と JST で同じ Date でも曜日が異なる場合があります。

## テストの TZ 非依存化

テスト時は `TZ=UTC` など環境変数でタイムゾーンを固定しましょう。

## まとめ

- getDay のズレは TZ 差異が原因。Intl で表示 TZ を明示する
- テストは TZ 固定（CI/ローカル差異を抑制）
- 仕様（UTC/JST）と要件を分けて設計する

## 関連リンク

- 内部: [Cron JST ツール](/tools/cron-jst), [GitHub Actions の cron は UTC](/blog/gha-cron-utc)
- 外部: [MDN: Date](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date), [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
