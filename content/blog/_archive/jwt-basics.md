---
benefits: ""
for: ""
audience: ["初心者","中級者"]
title: JWT基礎と安全な検証のポイント
date: 2025-09-05
author: site-admin
published: false
robots: 'noindex,follow'
tags:
  - internal
  - archived
description: alg=none攻撃の拒否、署名鍵形式（PKCS#1/PKCS#8/SPKI）の扱い、`exp`/`nbf`のズレ対処（leeway）など、実務で最低限押さえるべきJWT運用の基礎と検証ポイントを整理します。
---

**対象読者**: JWT を発行/検証するバックエンド開発者・セキュリティ担当。

**この記事で得られること**: alg=none 拒否、鍵形式、期限検証(leeway)など最低限の安全運用ポイントが分かります。

## JWT とは

## 用語ミニ辞典（簡易）

- JWS: 署名付きトークン（署名の検証で改ざん検出）
- JWE: 暗号化トークン（内容を秘匿）。JWS と混同しない
- `alg`: 署名/暗号アルゴリズム。例: HS256（共有鍵）, RS256（公開鍵）
- `exp`/`nbf`: 期限（有効期限/Not Before）。小さな leeway を設ける

**JSON Web Token (JWT)** はヘッダ・ペイロード・署名の 3 区分で構成される自己完結型トークンです。API Gateway / フロント間セッションレス認証などで広く利用されています。

```text
header.payload.signature
```

## ありがちな落とし穴

1. **alg=none 受け入れ**: ライブラリのデフォルト挙動を過信しない
2. **鍵形式の混在**: PKCS#1, PKCS#8, SPKI, 証明書 (X.509) のどれが必要か明確化
3. **タイムスキュー**: `exp` / `nbf` の閾値に小さな leeway 秒を設ける
4. **JWE/JWS 混同**: 暗号化(JWE)と署名(JWS)は異なるレイヤ

## 本サイトの verify 実装方針

- HS256 / RS256 のみサポート (none 拒否)
- RS256 は `-----BEGIN PUBLIC KEY-----` (SPKI) のみ受理
- 署名不一致, alg 不一致, 期限切れ, nbf 未到達 を個別エラーコード化
- 完全ローカル検証 (キー/トークンは送信しない)

## 最低限のチェックリスト

- [ ] 受理する `alg` をホワイトリスト固定
- [ ] none / 未知アルゴリズム拒否
- [ ] exp / nbf を UTC 秒で検証 (leeway 検討)
- [ ] kid ありの場合 JWKS キャッシュと強制再取得経路
- [ ] 例外時 (JSON / Base64URL) の握り潰し禁止

## まとめ

JWT は便利だが「入力を無条件信頼しない」ことが最重要。verify ロジックを簡潔かつ明示的に保ち、監査可能性を高めることで安全性と可観測性が向上します。

## 関連リンク

- 内部: [JWT デコードツール](/tools/jwt-decode)
- 外部: [RFC 7519: JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)
