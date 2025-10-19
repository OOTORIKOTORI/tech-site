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
                        <h1 class="page-title">広告について(Ads Policy)</h1>

                        <p>
                                このサイトでは、コンテンツの維持と運営コストの補填を目的として Google AdSense を利用する場合があります。広告の配信には Cookie
                                等が使用され、ユーザーの興味・関心に基づく広告(パーソナライズド広告)が表示されることがあります。広告に関する基本方針や ads.txt
                                の取扱いについては、後日詳細を追記します。パーソナライズド広告を無効化する方法や
                                Google によるデータの取り扱いについては各社の案内をご参照ください。
                        </p>

                        <h2>広告配信の概要</h2>
                        <ul>
                                <li>本サイトは、コンテンツ維持と運営コスト補填のため、第三者配信の広告を掲載する場合があります。</li>
                                <li>広告では Cookie 等の技術が使用され、パーソナライズド広告が表示されることがあります。</li>
                                <li>パーソナライズはいつでも無効化できます（下記「オプトアウト」をご参照ください）。</li>
                                <li>広告取引の透明性のため、サイト直下の <code>/ads.txt</code> を公開しています（詳細は下記参照）。</li>
                        </ul>

                        <h2>第三者配信の広告について</h2>
                        <p>
                                Migaki Explorer
                                では、第三者配信による広告サービスを利用する場合があります。これらの広告配信業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、Cookie（クッキー）や広告識別子などの技術を使用することがあります。
                        </p>

                        <h2>Cookie と広告識別子の利用</h2>
                        <p>
                                当サイトおよび第三者配信業者は、ユーザーの過去のアクセス情報に基づいて広告を配信する場合があります。この際、Cookie
                                や類似の技術が使用され、個人を特定できない範囲で情報を収集することがあります。
                        </p>

                        <h2>オプトアウト（広告カスタマイズの無効化）</h2>
                        <ul>
                                <li>
                                        <a href="https://adssettings.google.com/"
                                                class="text-blue-600 hover:underline focus-ring"
                                                rel="noopener noreferrer" target="_blank"
                                                aria-label="Google広告設定ページ（外部リンク）">Google 広告設定</a> から、広告のパーソナライズを無効化できます。
                                </li>
                                <li>
                                        Google による広告と Cookie の取り扱いは、
                                        <a href="https://policies.google.com/technologies/ads?hl=ja"
                                                class="text-blue-600 hover:underline focus-ring"
                                                rel="noopener noreferrer" target="_blank"
                                                aria-label="Googleの広告ポリシー（外部リンク）">広告に関するポリシー</a>
                                        をご参照ください。
                                </li>
                        </ul>
                        <p>その他の第三者配信業者については、各社のプライバシーポリシーをご確認ください。</p>

                        <h2>ads.txt の所在</h2>
                        <p>
                                認定販売者の宣言ファイル（ads.txt）は、サイト直下に設置しています。広告配信の透明性確保を目的としています。
                        </p>
                        <p>
                                <a href="/ads.txt" class="text-blue-600 hover:underline focus-ring" target="_blank"
                                        rel="noopener noreferrer" aria-label="ads.txt を新しいタブで開く">/ads.txt を開く</a>
                        </p>

                        <h2>個人情報の取り扱い</h2>
                        <p>
                                広告配信に関連する個人情報の取り扱いについては、<NuxtLink to="/privacy"
                                        class="text-blue-600 hover:underline focus-ring">
                                        プライバシーポリシー
                                </NuxtLink>をご確認ください。サイト利用規約については<NuxtLink to="/terms"
                                        class="text-blue-600 hover:underline focus-ring">
                                        利用規約
                                </NuxtLink>をご覧ください。
                        </p>

                        <h2>広告掲載基準</h2>
                        <p>当サイトでは、コンテンツとの親和性を重視し、ユーザー体験を損なわない範囲で広告を掲載します。不適切な広告についてのご指摘がありましたら、お気軽にご連絡ください。</p>

                        <h2>お問い合わせ</h2>
                        <p>
                                広告に関するご質問・ご意見は、<NuxtLink to="/contact" class="text-blue-600 hover:underline focus-ring">
                                        お問い合わせページ
                                </NuxtLink>
                                よりお寄せください。
                        </p>

                        <p class="text-sm text-gray-600 mt-8">
                                最終更新日: <time :datetime="updatedAt">{{ new
                                        Date(updatedAt).toLocaleDateString('ja-JP') }}</time>
                        </p>
                </article>
        </main>
</template>
