# 既知=200／未知=404／白紙なし スモーク手順（最新版）

更新: 2025-11-01

本手順は docs/HANDBOOK.md の「検証ブロック」を“1 枚”に蒸留したクイック版です。Terminal A は `pnpm dev` 専用、確認は **Terminal B** で行います。

---

## 共通準備

- ブラウザ: DevTools → **Disable cache** を ON、更新は **Ctrl+Shift+R**
- SSR の実体確認は View Source（Ctrl+U）または curl/iwr を使用

## 1) 制御記事 `/blog/_control` の robots 確認

- PowerShell

  ```powershell
  (Invoke-RestMethod -Uri "http://localhost:3000/api/blogv2/doc?path=/blog/_control").robots
  ```

  → `"noindex,follow"` が表示されること。

- macOS/Linux
  ```bash
  curl -s "http://localhost:3000/api/blogv2/doc?path=/blog/_control" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).robots))"
  ```

## 2) `<meta name="robots">` の出力確認（\_control のみ）

- PowerShell
  ```powershell
  ($r = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/blog/_control").Content
  $r -match '<meta name="robots" content="noindex,follow"'
  ```
- macOS/Linux
  ```bash
  curl -s "http://localhost:3000/blog/_control" | grep -i '<meta name="robots" content="noindex,follow"'
  ```

## 3) 既知=200／未知=404／**白紙なし**

- PowerShell

  ```powershell
  # 既知 slug（例）
  (Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/blog/welcome").StatusCode
  # 未知 slug（テンプレ見出し = 白紙でない）
  ($e = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/blog/__missing__" -SkipHttpErrorCheck).StatusCode
  $e
  ```

- macOS/Linux
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/blog/welcome"
  curl -s -o -D - "http://localhost:3000/blog/__missing__" | head -n 20
  ```

**合格基準**

- 既知 slug: **200** かつ HTML に `<article` が存在
- 未知 slug: **404** かつ エラーテンプレ見出し（`data-testid="error-heading"`）が出て **白紙ではない**

## 4) SSR 相対 URL 回帰の検知（抜粋）

```bash
curl -s "http://localhost:3000/blog/welcome" | grep -q "Only absolute URLs are supported" && echo "NG" || echo "OK"
```

## 5) OGP スモーク（200/302 合格）

```bash
node scripts/smoke-og.mjs
# もしくは ORIGIN を明示して直接:
curl -I "$(node -e "console.log(new URL('/api/og/hello.png','http://localhost:3000').href)")"
```

## 6) Preview noindex（任意）

```bash
curl -I https://<your-project>.vercel.app/ | grep -i x-robots-tag || echo "header missing"
```

---

## 7) Tools 主要ページの 200 スモーク（任意）

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/tools/token-counter"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/tools/pwa-checker"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/tools/security-checker"
```

（注）API 連携ツールは外部サイトへのフェッチが発生するため、本番またはネットワーク到達性がある環境での検証を推奨します。

### トラブル時の速攻メモ

- HMR/キャッシュ疑い → ハードリロード + Disable cache
- API 応答に `robots` が無い → `/api/blogv2/doc?path=/blog/_control` の JSON を確認
- `<meta name="robots">` が出ない → `useHead` 条件/`key:'robots'` で衝突回避
- SSR 500（Only absolute…） → `useFetch` or 絶対 URL へ修正
