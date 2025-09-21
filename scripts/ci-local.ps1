Param()

$ErrorActionPreference = 'Stop'

pnpm typecheck; if (-not $?) { exit 1 }
pnpm lint -- --fix; if (-not $?) { exit 1 }
pnpm test -- --run; if (-not $?) { exit 1 }
pnpm build; if (-not $?) { exit 1 }
pnpm postbuild; if (-not $?) { exit 1 }
pnpm run smoke:og; if (-not $?) { exit 1 }

Write-Output "[ci-local] all green"
