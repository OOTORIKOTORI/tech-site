---
title: Webセキュリティヘッダ入門：攻撃を防ぐHTTPヘッダ設定ガイド
description: '課題: セキュリティヘッダの設定漏れで脆弱性が残る。得られること: 主要ヘッダの役割、推奨値、実装方法の基本。'
date: '2025-11-01'
tags:
  - 'tool:security-checker'
  - 入門
  - security
  - web
  - headers
audience: Web開発者・セキュリティ担当
type: primer
tool: security-checker
visibility: primer
robots: index
---

「セキュリティ診断で HTTP ヘッダの設定不足を指摘された…」「CSP や HSTS って何？どう設定すればいいの？」そんな悩みはありませんか？
この記事では、Web セキュリティヘッダの基本、主要ヘッダの役割と推奨値、よくある落とし穴・対策を短時間で解説します。
まずは関連ツール「Security Header Checker」で自分のサイトをチェックしてみましょう。

---

## 1. 基本の構造（セキュリティヘッダとは）

**セキュリティヘッダ**は、HTTP レスポンスに含まれる特殊なヘッダで、ブラウザに対してセキュリティポリシーを指示します。
XSS、クリックジャッキング、データ漏洩などの攻撃を防ぐ重要な防御層です。

### 主要なセキュリティヘッダ一覧

| ヘッダ名                     | 重要度 | 防御対象                   |
| ---------------------------- | ------ | -------------------------- |
| Content-Security-Policy      | 最高   | XSS、インジェクション      |
| Strict-Transport-Security    | 最高   | 中間者攻撃、盗聴           |
| X-Frame-Options              | 高     | クリックジャッキング       |
| X-Content-Type-Options       | 中     | MIME スニッフィング        |
| Referrer-Policy              | 中     | 情報漏洩                   |
| Permissions-Policy           | 低     | 不要な機能の制限           |
| Cross-Origin-Opener-Policy   | 低     | クロスオリジン分離         |
| Cross-Origin-Embedder-Policy | 低     | クロスオリジンリソース保護 |

---

## 2. 重要ヘッダの詳細と設定例

### Content-Security-Policy (CSP)

**役割**: スクリプトやスタイルの読み込み元を制限し、XSS 攻撃を防ぐ

**推奨値**:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.example.com;
```

**説明**:

- `default-src 'self'`: デフォルトは同一オリジンのみ
- `script-src`: JavaScript の読み込み元を制限
- `style-src 'unsafe-inline'`: インラインスタイルを許可（必要に応じて）
- `img-src`: 画像は data URI と HTTPS を許可

---

### Strict-Transport-Security (HSTS)

**役割**: HTTPS 通信を強制し、HTTP へのダウングレード攻撃を防ぐ

**推奨値**:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**説明**:

- `max-age=31536000`: 1 年間（秒単位）HTTPS を強制
- `includeSubDomains`: サブドメインも対象
- `preload`: ブラウザの HSTS プリロードリストに登録可能

**重要**: HTTPS 環境でのみ有効です。

---

### X-Frame-Options

**役割**: iframe による埋め込みを制限し、クリックジャッキングを防ぐ

**推奨値**:

```
X-Frame-Options: DENY
```

または

```
X-Frame-Options: SAMEORIGIN
```

**説明**:

- `DENY`: いかなるサイトでも iframe 埋め込み禁止
- `SAMEORIGIN`: 同一オリジンのみ許可

---

### X-Content-Type-Options

**役割**: ブラウザの MIME タイプ推測を無効化し、誤った Content-Type 解釈を防ぐ

**推奨値**:

```
X-Content-Type-Options: nosniff
```

---

### Referrer-Policy

**役割**: リファラー情報の送信範囲を制限し、プライバシーを保護

**推奨値**:

```
Referrer-Policy: strict-origin-when-cross-origin
```

または

```
Referrer-Policy: no-referrer
```

**説明**:

- `strict-origin-when-cross-origin`: 同一オリジンでは完全 URL、クロスオリジンではオリジンのみ
- `no-referrer`: リファラー情報を一切送信しない

---

## 3. 実例（Nginx での設定）

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;

    # クリックジャッキング対策
    add_header X-Frame-Options "DENY" always;

    # MIME スニッフィング対策
    add_header X-Content-Type-Options "nosniff" always;

    # リファラーポリシー
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Permissions-Policy
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # ... SSL 証明書などの設定
}
```

---

## 4. 実例（Apache での設定）

`.htaccess` または `httpd.conf`:

```apache
# HSTS
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# CSP
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"

# クリックジャッキング対策
Header always set X-Frame-Options "DENY"

# MIME スニッフィング対策
Header always set X-Content-Type-Options "nosniff"

# リファラーポリシー
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

---

## 5. 落とし穴（❌ 失敗 →✅ 対策）

### CSP を厳格にしすぎて機能が壊れる

- ❌ `default-src 'none'` で全て遮断し、画像やスタイルが表示されない
- ✅ 段階的に設定し、ブラウザのコンソールでエラーを確認しながら調整しましょう

### HSTS を HTTP サイトに設定

- ❌ HTTP サイトに HSTS を設定しても無視される
- ✅ HTTPS に移行してから HSTS を設定しましょう

### X-Frame-Options と CSP の frame-ancestors の競合

- ❌ 両方設定して混乱する
- ✅ CSP の `frame-ancestors` が優先されます。両方設定する場合は整合性を保ちましょう

### Referrer-Policy で Analytics が動かない

- ❌ `no-referrer` で Google Analytics のリファラー情報が取得できない
- ✅ `strict-origin-when-cross-origin` を使いましょう

### max-age が短すぎる

- ❌ HSTS の `max-age=300`（5 分）で効果が薄い
- ✅ 最低でも `max-age=31536000`（1 年）を推奨

---

## 6. 手を動かす（3 手で検証）

1. [Security Header Checker](/tools/security-checker) にアクセスします
2. あなたのサイトの URL を入力します
3. 検証結果を確認し、欠落ヘッダを設定します

**試してみよう**:

- Google、GitHub、Twitter などの有名サイトを検査して、推奨設定を学ぶ
- ブラウザの DevTools → Network タブでレスポンスヘッダを確認

---

## 7. セキュリティレベルの判定基準

| スコア | レベル | 状態                                 |
| ------ | ------ | ------------------------------------ |
| 90-100 | 優秀   | 主要ヘッダが適切に設定されている     |
| 70-89  | 良好   | 基本的なヘッダはあるが改善の余地あり |
| 50-69  | 要改善 | 重要なヘッダが不足している           |
| 0-49   | 危険   | セキュリティヘッダがほとんど未設定   |

---

## 8. クイズ

1. XSS 攻撃を防ぐ最も重要なヘッダは？
2. HSTS ヘッダの `max-age` の推奨値は？
3. `X-Frame-Options: SAMEORIGIN` の意味は？

### 答え

1. Content-Security-Policy (CSP)
2. 31536000（1 年間、秒単位）
3. 同一オリジンのサイトのみ iframe で埋め込み可能

---

## 9. まとめ

- セキュリティヘッダは XSS、クリックジャッキング、データ漏洩を防ぐ重要な防御層
- 最優先: **Content-Security-Policy** と **Strict-Transport-Security**
- 推奨: **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy**
- HTTPS 環境でホストが必須（特に HSTS）
- CSP は段階的に設定し、ブラウザコンソールで検証しましょう
- 「Security Header Checker」で現状を把握し、欠落ヘッダを設定しましょう
- 実際に手を動かして、自分のサイトのセキュリティレベルを向上させましょう

---

まずは「Security Header Checker」で自分のサイトをチェックしてみましょう。
→ [Security Header Checker](/tools/security-checker)
