param([ValidateSet('auto','patch','minor','major')][string]$bump='auto')

$last = (git tag --list "v*" --sort=-v:refname | Select-Object -First 1); if (-not $last) { $last='v0.0.0' }
$parts = $last.TrimStart('v') -split '\.'; [int]$maj=$parts[0]; [int]$min=$parts[1]; [int]$pat=$parts[2]

if ($bump -eq 'auto') {
  $subj = git log -1 --pretty=%s
  $body = git log -1 --pretty=%B
  if ($subj -match '!' -or $body -match 'BREAKING CHANGE') { $bump='major' }
  elseif ($subj -match '^(feat|perf)') { $bump='minor' }
  else { $bump='patch' }
}

switch ($bump) { 'major' {$maj++; $min=0; $pat=0}; 'minor' {$min++; $pat=0}; 'patch' {$pat++} }
$next = "v$maj.$min.$pat"; $msg=(git log -1 --pretty=%s)
Write-Host "Last: $last -> Next: $next (bump=$bump)"
git tag -a $next -m $msg
git push origin $next
