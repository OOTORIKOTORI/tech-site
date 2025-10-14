#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// AdSense設定の妥当性をチェック
function checkAdsenseConfig() {
  const enableAds = process.env.NUXT_PUBLIC_ENABLE_ADS

  // Ads無効時はチェック不要
  if (enableAds !== '1') {
    console.log('✓ Ads disabled, skip AdSense validation')
    return true
  }

  console.log('📊 Validating AdSense configuration (ENABLE_ADS=1)...')

  // 1. AdSense Client IDの形式チェック
  const adsenseClient = process.env.NUXT_PUBLIC_ADSENSE_CLIENT
  if (!adsenseClient || !adsenseClient.startsWith('ca-pub-')) {
    console.error('❌ NUXT_PUBLIC_ADSENSE_CLIENT must start with "ca-pub-" when ENABLE_ADS=1')
    return false
  }

  // 2. プラグインファイルの存在と内容チェック
  const adsPluginPath = path.join(process.cwd(), 'plugins', 'ads.ts')
  if (!fs.existsSync(adsPluginPath)) {
    console.error('❌ AdSense plugin not found: plugins/ads.ts')
    return false
  }

  const adsPluginContent = fs.readFileSync(adsPluginPath, 'utf8')
  if (!adsPluginContent.includes('pagead2.googlesyndication.com')) {
    console.error('❌ AdSense script URL not found in plugins/ads.ts')
    return false
  }

  // 3. ビルド成果物の存在確認
  const buildOutputPath = path.join(process.cwd(), '.output', 'server')
  if (!fs.existsSync(buildOutputPath)) {
    console.error('❌ Build output not found. Run "pnpm build" first.')
    return false
  }
  console.log('✓ AdSense configuration valid')
  return true
}

// メイン実行
if (checkAdsenseConfig()) {
  process.exit(0)
} else {
  process.exit(1)
}
