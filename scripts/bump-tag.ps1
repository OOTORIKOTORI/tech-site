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

# Skip if tag already exists locally
$null = git rev-parse -q --verify "refs/tags/$NEXT" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $NEXT already exists locally; skipping."
  exit 0
}

# Create annotated tag
git tag -a $NEXT -m "$NEXT"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to create tag $NEXT" -ForegroundColor Red
  exit 1
}

# Check if tag already exists on remote (ls-remote exits 0 even when not found, so check output)
$remoteMatch = git ls-remote --tags origin "refs/tags/$NEXT" 2>$null
if ($remoteMatch) {
  Write-Host "Tag $NEXT already exists on remote; resolving collision..."
  # Try bumping patch until a free tag is found within the same major/minor
  if ($NEXT -notmatch '^v(?<maj>\d+)\.(?<min>\d+)\.(?<pat>\d+)$') {
    Write-Host "Unexpected tag format for NEXT: $NEXT" -ForegroundColor Red
    exit 1
  }
  $maj = [int]$Matches.maj
  $min = [int]$Matches.min
  $pat = [int]$Matches.pat
  for ($i = 0; $i -lt 100; $i++) {
    $pat++
    $candidate = "v$maj.$min.$pat"
    $localExists = $false
    $null = git rev-parse -q --verify "refs/tags/$candidate" 2>$null
    if ($LASTEXITCODE -eq 0) { $localExists = $true }
    $remoteExists = [bool](git ls-remote --tags origin "refs/tags/$candidate" 2>$null)
    if (-not $localExists -and -not $remoteExists) {
      Write-Host "→ Using next available tag: $candidate" -ForegroundColor Yellow
      $NEXT = $candidate
      break
    }
  }
  if ($NEXT -match '^v\d+\.\d+\.\d+$' -and $remoteMatch -and $NEXT -eq [string]$Matches.OriginalString) {
    Write-Host "Failed to resolve tag collision for $NEXT" -ForegroundColor Red
    exit 1
  }
}

# Push only that tag
git push origin $NEXT
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Created and pushed tag: $NEXT" -ForegroundColor Green
} else {
  Write-Host "Failed to push tag $NEXT" -ForegroundColor Red
  exit 1
}
