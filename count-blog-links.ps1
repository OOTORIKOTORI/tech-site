# blogリンク数カウント用PowerShellスクリプト
# /blog のHTMLから <a href="/blog/ で始まるリンク数をカウント

$html = Invoke-WebRequest -Uri http://localhost:3000/blog -UseBasicParsing | Select-Object -ExpandProperty Content
$blogLinks = [regex]::Matches($html, '<a href="/blog/')
$blogLinks.Count
