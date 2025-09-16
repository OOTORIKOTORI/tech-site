---
title: 'JavaScriptの日時とタイムゾーン超入門（getDayがズレる理由）'
description: 'JSのDate, Intl, timeZone, getDayの落とし穴とテストのTZ非依存化を解説。'
date: '2025-09-16'
tags:
  - JavaScript
  - Date
  - TimeZone
  - getDay
  - テスト
  - JST
  - UTC
---

JavaScript で日時を扱うとき、タイムゾーンの違いで「getDay()」の値がズレることがあります。なぜでしょう？

# Date の基礎

Date オブジェクトは常に「ローカルタイムゾーン」を基準に動作します。

# Intl+timeZone

`Intl.DateTimeFormat`を使うと、任意のタイムゾーンで日時を表示できます。

```js
const d = new Date('2025-09-16T00:00:00Z')
const fmt = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' })
console.log(fmt.format(d)) // JSTでの曜日
```

# UTC と JST

UTC と JST で同じ Date でも曜日が異なる場合があります。

# テストの TZ 非依存化

テスト時は `TZ=UTC` など環境変数でタイムゾーンを固定しましょう。
