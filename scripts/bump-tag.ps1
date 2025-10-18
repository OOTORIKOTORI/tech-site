Param(
  [ValidateSet('patch','minor','major')]
  [string]$bump = 'patch'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-NextVersion([string]$last, [string]$bump) {
  if (-not $last) { $last = 'v0.0.0' }
  # Strictly parse vX.Y.Z
  if ($last -notmatch '^v(?<maj>\d+)\.(?<min>\d+)\.(?<patch>\d+)$') {
    throw "Last tag '$last' is not semver (vX.Y.Z)"
  }
  $major = [int]$Matches.maj
  $minor = [int]$Matches.min
  $patch = [int]$Matches.patch
  switch ($bump) {
    'major' { $major++; $minor = 0; $patch = 0 }
    'minor' { $minor++; $patch = 0 }
    default { $patch++ }
  }
  return "v$major.$minor.$patch"
}


$tags = git tag --list "v*.*.*"
Write-Host "[DEBUG] tags: $tags"
if ($tags) {
  $latest = $tags | Sort-Object { [version]($_ -replace '^v','') } -Descending | Select-Object -First 1
  $LAST = $latest
} else {
  $LAST = 'v0.0.0'
}
$NEXT = Get-NextVersion $LAST $bump

Write-Host "Last: $LAST -> Next: $NEXT (bump=$bump)"

# Skip if tag already exists
$null = git rev-parse -q --verify "refs/tags/$NEXT" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $NEXT already exists; skipping."
  exit 0
}

# Create annotated tag and push only that tag
git tag -a $NEXT -m "$NEXT"
git push origin $NEXT
