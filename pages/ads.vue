<script setup lang="ts">
import { useSeoMeta, useHead } from '#imports'
import { useCanonicalUrl } from '@/utils/siteMeta'

const title = '広告について（Ads Policy）'
const description = 'Migaki Explorer の広告配信・Cookie利用・オプトアウト等に関するポリシーです。'
const canonical = useCanonicalUrl()

useHead(() => ({
        link: [{ rel: 'canonical', href: canonical.value }]
}))
useSeoMeta({
        title,
        description,
        ogTitle: title,
        ogDescription: description,
        ogUrl: () => canonical.value,
})

const updatedAt = new Date().toISOString()
</script>

<template>
        <main>
                <article class="prose max-w-3xl mx-auto p-6">
                        <h1 class="page-title">広告について</h1>

                        <h2>運用方針</h2>
                        <ul>
                                <li>本サイトは Google AdSense を使用し、<strong>Production のみ有効</strong>（Preview/Dev は無効）です。</li>
                                <li>スクリプトは SSR の <code>&lt;head&gt;</code> に<strong>1 本のみ</strong>挿入され、重複を防止しています。</li>
                                <li>
a11y/Best Practices の品質基準（<strong>a11y ≥ 90 / Best Practices ≥
                                                0.70</strong>）を維持して運用します。
</li>
                        </ul>

                        <h2>ads.txt</h2>
                        <ul>
                                <li>配置場所は <code>/ads.txt</code>（<code>/public/ads.txt</code> で管理）。</li>
                                <li>ID は <strong>pub-… 形式</strong>を使用（<code>ca-pub-…</code> ではありません）。</li>
                                <li>
                                        <a href="/ads.txt" class="text-blue-600 hover:underline focus-ring"
                                                target="_blank" rel="noopener noreferrer">/ads.txt を開く</a>
                                </li>
                        </ul>

                        <h2>パーソナライズ / Cookie</h2>
                        <ul>
                                <li>広告のパーソナライズに Cookie が使われる場合があります。</li>
                                <li>
                                        非パーソナライズの設定は
                                        <a href="https://adssettings.google.com/"
                                                class="text-blue-600 hover:underline focus-ring" target="_blank"
                                                rel="noopener noreferrer">Google の広告設定</a>
                                        から変更できます。
                                </li>
                                <li>
                                        収集・利用の詳細は <NuxtLink to="/privacy"
                                                class="text-blue-600 hover:underline focus-ring">
プライバシーポリシー
</NuxtLink>
                                        をご参照ください。
                                </li>
                        </ul>

                        <h2>お問い合わせ</h2>
                        <p>
                                広告に関するお問い合わせは <NuxtLink to="/contact" class="text-blue-600 hover:underline focus-ring">
                                        /contact
</NuxtLink> からお願いします。
                        </p>

                        <p class="text-sm text-gray-600 mt-8">
                                最終更新日: <time :datetime="updatedAt">{{ new Date(updatedAt).toLocaleDateString('ja-JP')
                                        }}</time>
                        </p>
                </article>
        </main>
</template>
