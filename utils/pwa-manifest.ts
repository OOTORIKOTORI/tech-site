/**
 * PWA Manifest validation utilities
 */

export interface ManifestValidationResult {
  field: string
  status: 'ok' | 'warning' | 'error'
  message: string
  value?: string | number | null
  expected?: string
}

export interface IconValidation {
  src: string
  size: string
  status: 'ok' | 'warning' | 'missing'
  message: string
}

/**
 * Validate PWA manifest.json fields
 */
export function validateManifest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: any
): ManifestValidationResult[] {
  const results: ManifestValidationResult[] = []

  // Required fields
  if (!manifest.name && !manifest.short_name) {
    results.push({
      field: 'name / short_name',
      status: 'error',
      message: 'nameまたはshort_nameが必須です',
      value: null,
    })
  } else {
    if (manifest.name) {
      results.push({
        field: 'name',
        status: 'ok',
        message: 'アプリ名が設定されています',
        value: manifest.name,
      })
    }
    if (manifest.short_name) {
      results.push({
        field: 'short_name',
        status: 'ok',
        message: '短縮名が設定されています',
        value: manifest.short_name,
      })
    }
  }

  // start_url
  if (!manifest.start_url) {
    results.push({
      field: 'start_url',
      status: 'warning',
      message: 'start_urlの設定を推奨します',
      expected: '/ または /index.html',
    })
  } else {
    results.push({
      field: 'start_url',
      status: 'ok',
      message: 'スタートURLが設定されています',
      value: manifest.start_url,
    })
  }

  // display
  const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser']
  if (!manifest.display) {
    results.push({
      field: 'display',
      status: 'warning',
      message: 'displayモードの設定を推奨します',
      expected: 'standalone',
    })
  } else if (!validDisplayModes.includes(manifest.display)) {
    results.push({
      field: 'display',
      status: 'error',
      message: `無効なdisplayモード: ${manifest.display}`,
      expected: validDisplayModes.join(', '),
    })
  } else {
    results.push({
      field: 'display',
      status: 'ok',
      message: 'displayモードが設定されています',
      value: manifest.display,
    })
  }

  // theme_color
  if (!manifest.theme_color) {
    results.push({
      field: 'theme_color',
      status: 'warning',
      message: 'theme_colorの設定を推奨します',
      expected: '#RRGGBB形式',
    })
  } else {
    results.push({
      field: 'theme_color',
      status: 'ok',
      message: 'テーマカラーが設定されています',
      value: manifest.theme_color,
    })
  }

  // background_color
  if (!manifest.background_color) {
    results.push({
      field: 'background_color',
      status: 'warning',
      message: 'background_colorの設定を推奨します',
      expected: '#RRGGBB形式',
    })
  } else {
    results.push({
      field: 'background_color',
      status: 'ok',
      message: '背景色が設定されています',
      value: manifest.background_color,
    })
  }

  // icons
  if (!manifest.icons || !Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    results.push({
      field: 'icons',
      status: 'error',
      message: 'iconsが必須です（192x192と512x512を推奨）',
    })
  } else {
    results.push({
      field: 'icons',
      status: 'ok',
      message: `アイコンが${manifest.icons.length}個設定されています`,
      value: manifest.icons.length,
    })
  }

  return results
}

/**
 * Validate icon sizes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateIcons(manifest: any): IconValidation[] {
  const recommendedSizes = ['192x192', '512x512']
  const optionalSizes = ['144x144', '96x96', '72x72', '48x48']

  const icons = manifest.icons || []
  const iconValidations: IconValidation[] = []

  // Check for recommended sizes
  for (const size of recommendedSizes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = icons.find((icon: any) => icon.sizes === size)
    if (found) {
      iconValidations.push({
        src: found.src,
        size,
        status: 'ok',
        message: `推奨サイズ ${size} が設定されています`,
      })
    } else {
      iconValidations.push({
        src: '',
        size,
        status: 'missing',
        message: `推奨サイズ ${size} がありません`,
      })
    }
  }

  // Check for optional sizes
  for (const size of optionalSizes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = icons.find((icon: any) => icon.sizes === size)
    if (found) {
      iconValidations.push({
        src: found.src,
        size,
        status: 'ok',
        message: `オプショナルサイズ ${size} が設定されています`,
      })
    } else {
      iconValidations.push({
        src: '',
        size,
        status: 'warning',
        message: `オプショナルサイズ ${size} がありません（任意）`,
      })
    }
  }

  return iconValidations
}

/**
 * Calculate overall score (0-100)
 */
export function calculateManifestScore(results: ManifestValidationResult[]): number {
  let score = 100
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length

  score -= errorCount * 20
  score -= warningCount * 5

  return Math.max(0, score)
}
