---
title: 'JSON入門：整形と構造を理解する'
description: 'JSONの基本構造・よくある構文エラー・整形（フォーマット）と検証の違いを初心者向けに解説。'
date: 2025-10-22
published: true
audience: ['初学者', 'Webエンジニア']
tags: ['tool:json-formatter', 'json', 'format', 'debug']
---

> 関連ツール: [/tools/json-formatter](/tools/json-formatter)

API レスポンスや設定ファイルで日常的に使う**JSON**。でも、カンマやクォートのミスで赤エラー…は“あるある”です。
本記事では、JSON の基礎と整形（フォーマット）/検証の違いをシンプルに解説します。

---

## 1. 導入：よくある悩み・初心者の疑問

- どこがエラーなのか分からない
- 整形すると何が嬉しいの？
- JSON と JavaScript オブジェクトの違いは？

---

## 2. そもそも定義：JSON とは

**JSON（JavaScript Object Notation）**は、キーと値でデータを表現するテキスト形式。主な型は、オブジェクト`{}`、配列`[]`、文字列、数値、真偽値、`null`。

例：

```json
{
  "name": "Alice",
  "age": 20,
  "skills": ["JS", "API"]
}
```

---

## 3. 仕組み・構造：整形と検証

- 整形（フォーマット）: インデントや改行を入れて読みやすくする
- 最小化（minify）: 逆に空白を削って軽量化
- 検証（validate）: 構文が正しいかパースして確認

---

## 4. よくあるつまずき／勘違い

- 末尾カンマ（trailing comma） → JSON では不可
- シングルクォート → JSON 文字列はダブルクォートのみ
- コメント → JSON 規格にコメントは存在しない
- 数値先頭の`0`や`NaN` → 非対応

---

## 5. 実例：具体的に使う場面

- API レスポンスを読みやすく整形してデバッグ
- 設定ファイルの差分確認（整形 → 比較）
- JSON Schema と合わせた入力検証

---

## 6. セキュリティ・運用上の注意

- 機密情報（トークン/パスワード）は貼り付けない
- ブラウザ内処理であっても、共有端末では履歴に注意

---

## 7. 手を動かす：関連ツール `/tools/json-formatter` の紹介

- [/tools/json-formatter](/tools/json-formatter) にアクセス
- 入力欄に JSON を貼り付け → 「整形」または「最小化」
- エラーメッセージを手掛かりに構文修正

---

## 8. 3 分クイズ or ミニまとめ

- JSON と JS オブジェクトの違いは？ → 文字列形式/表現制限あり
- 整形と検証の違いは？ → 見やすくする vs. 構文チェック
- NG 記法は？ → 末尾カンマ/単引用符/コメント

<details>
<summary>クイズ（3問）</summary>

1. JSON 文字列のクォートは？ → ダブルのみ
2. コメントは書ける？ → いいえ
3. 末尾カンマは OK？ → いいえ

</details>

---

## 9. 関連リンク

- 仕様: https://www.rfc-editor.org/rfc/rfc8259
- JSON Schema: https://json-schema.org/

> 関連ツール: [/tools/json-formatter](/tools/json-formatter)
