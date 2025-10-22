# Project Structure (generated, do not edit)
> Update with: `pnpm docs:tree`  / Deep: `pnpm docs:tree:deep`

---

C:\website\tech-site
├── #
|  └── node_modules
├── $null
├── 0001-chore-initial.patch
├── app.config.ts
├── app.vue
├── assets
|  └── css
|     ├── buttons-contrast-override.css
|     ├── buttons-contrast.css
|     ├── forms-dark.css
|     ├── sections.css
|     ├── surface.css
|     ├── tailwind.css
|     ├── typography-boost.css
|     └── typography-overrides.css
├── check-status.txt
├── components
|  ├── AdSlot.vue
|  ├── AppFooter.vue
|  ├── AppHeader.vue
|  ├── AudienceNote.vue
|  ├── blog
|  |  ├── Article.vue
|  |  ├── BlogToc.vue
|  |  ├── GlossaryTerm.vue
|  |  └── SeriesNav.vue
|  ├── content
|  |  ├── Footnote.vue
|  |  ├── Footnotes.vue
|  |  ├── ProseImg.vue
|  |  ├── ProsePre.vue
|  |  ├── ProseTable.vue
|  |  ├── Ref.vue
|  |  └── Term.vue
|  ├── CookieConsent.vue
|  ├── GlobalNav.vue
|  ├── RelatedList.vue
|  ├── TagChip.vue
|  ├── ThemeToggle.vue
|  ├── ToolIntro.vue
|  ├── ToolIntroBox.vue
|  ├── TopCharts.vue
|  └── TopSummary.vue
├── composables
|  ├── queryContent.reexport.ts
|  ├── queryContent.ts
|  ├── useBreadcrumbJsonLd.ts
|  ├── usePosts.ts
|  ├── useSiteBrand.ts
|  └── _contentQuery.ts
├── content
|  ├── blog
|  |  ├── blog_og_first_aid.md
|  |  ├── cron-basics.md
|  |  ├── json-formatter-basics.md
|  |  ├── jwt-decode-basics.md
|  |  ├── lighthouse-best-practices-070.md
|  |  ├── linux-top-cheatsheet.md
|  |  ├── nnn-dev-notes-oct.md
|  |  ├── nnn-lhci-green-tips.md
|  |  ├── nnn-og-check-mini.md
|  |  ├── nuxt-ssr-absolute-url.md
|  |  ├── og-check-basics.md
|  |  ├── pxe-boot-minimum.md
|  |  ├── regex-tester-basics.md
|  |  ├── site-check-basics.md
|  |  ├── top-analyzer-basics.md
|  |  ├── welcome.md
|  |  ├── _archive
|  |  ├── _control.md
|  |  └── _dir.yml
|  ├── posts
|  |  └── hello.md
|  ├── tools
|  |  └── help.md
|  └── _templates
|     ├── blog.md
|     └── post.md
├── content.config.ts
├── content.config.ts.bak
├── count-blog-links.ps1
├── debug-cron.mjs
├── debug-cron2.mjs
├── debug.js
├── docs
|  ├── HANDBOOK.md
|  ├── PROJECT_STRUCTURE.md
|  ├── robots.txt
|  └── sitemap.xml
├── error.vue
├── handover_document.md
├── layouts
|  └── default.vue
├── memo
|  ├── copilotメッセージ.txt
|  ├── Github_CI_ログ.txt
|  ├── memo.txt
|  ├── review.patch.txt
|  ├── コードまとめ.txt
|  ├── ターミナルログ.txt
|  ├── ネットワークタブのログ.txt
|  └── ブラウザ_コンソールログ.txt
├── node_modules
|  ├── @eslint
|  ├── @nuxt
|  ├── @nuxtjs
|  ├── @tailwindcss
|  ├── @types
|  ├── @typescript-eslint
|  ├── @vitejs
|  ├── @vitest
|  ├── @vue
├── nuxt.config.ts
├── package.json
├── pages
|  ├── about.vue
|  ├── ads.vue
|  ├── blog
|  |  ├── index.vue
|  |  └── [...slug].vue
|  ├── contact.vue
|  ├── index.vue
|  ├── privacy.vue
|  ├── terms.vue
|  ├── tools
|  |  ├── cron-jst.vue
|  |  ├── help.vue
|  |  ├── index.vue
|  |  ├── json-formatter.vue
|  |  ├── jwt-decode.vue
|  |  ├── og-check.vue
|  |  ├── regex-tester.vue
|  |  ├── site-check.vue
|  |  └── top-analyzer.vue
|  ├── tools.vue
|  ├── [...path].vue
|  └── __blog_v1
|     └── [slug].vue
├── plugins
|  ├── ads.client.ts
|  ├── ads.ts
|  ├── consent.client.ts
|  └── meta-defaults.client.ts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── PROJECT_SPEC.md
├── public
|  ├── ads.txt
|  ├── favicon.ico
|  ├── feed.xml
|  ├── logo.png
|  ├── manifest.webmanifest
|  ├── og-default.png
|  ├── samples
|  |  └── top_sample.log
|  ├── sitemap.xml
|  └── sitemap.xml.83830664-79b1-429b-b611-c2e6184c5a76.tmp
├── README.md
├── review.patch
├── review.patch.txt
├── review_patch.txt
├── scripts
|  ├── bump-tag.ps1
|  ├── ci
|  |  ├── guard-adsense.cjs
|  |  ├── guard-audience.cjs
|  |  ├── guard-blog-no-internal.cjs
|  |  ├── guard-content-import.cjs
|  |  ├── guard-control-post.cjs
|  |  ├── guard-markdown-shapes.cjs
|  |  └── guard-relative-fetch.cjs
|  ├── ci-local.ps1
|  ├── gen-meta.mjs
|  ├── migrate-blog-template.cjs
|  ├── ops
|  |  ├── rollback.ps1
|  |  └── smoke-control-seo.cjs
|  ├── report-content-quality.mjs
|  └── smoke-og.mjs
├── server
|  ├── api
|  |  ├── blogv2
|  |  ├── debug
|  |  ├── feed.xml.get.ts
|  |  ├── health.ts
|  |  ├── og
|  |  ├── ogcheck.get.ts
|  |  └── sitecheck.get.ts
|  ├── assets
|  |  ├── feed.xml
|  |  └── sitemap.xml
|  ├── middleware
|  |  └── noindex-preview.ts
|  ├── plugins
|  |  ├── ads-check.ts
|  |  ├── log-site-url.ts
|  |  └── query-content.ts
|  └── routes
|     ├── feed.xml.ts
|     ├── robots.txt.get.ts
|     └── sitemap.xml.ts
├── simple-test.mjs
├── System.Text.ASCIIEncoding
├── tailwind.config.ts
├── tech-site_handover_notes.txt
├── test
|  └── jwt-es256.spec.ts
├── tests
|  ├── api
|  |  ├── blogv2.list.spec.ts
|  |  ├── og.spec.ts
|  |  └── static-xml.spec.ts
|  ├── app.footer.render.test.ts
|  ├── app.header.nav.test.ts
|  ├── app.rss-link.test.ts
|  ├── components
|  |  └── app.footer.legal-links.test.ts
|  ├── content
|  |  ├── blog.content.test.ts
|  |  ├── blog.listing.filter.test.ts
|  |  └── quality.blog.spec.ts
|  ├── e2e
|  |  ├── blog.detail.spec.ts
|  |  ├── blog.spec.ts
|  |  └── top-analyzer.http.spec.ts
|  ├── pages
|  |  ├── ads.render.test.ts
|  |  ├── blog.index.date-format.test.ts
|  |  ├── blog.index.render.test.ts
|  |  ├── blog.slug.render.test.ts
|  |  ├── blog.slug.resolve.test.ts
|  |  ├── blog.slug.seo.test.ts
|  |  ├── index.render.test.ts
|  |  ├── privacy.render.test.ts
|  |  ├── terms.render.test.ts
|  |  ├── tools.jwt-decode.learnlink.test.ts
|  |  └── tools.render.test.ts
|  ├── scripts
|  |  ├── gen-meta.sitemap.test.ts
|  |  └── gen-rss.feed.test.ts
|  ├── seo
|  |  ├── breadcrumb.spec.ts
|  |  ├── jsonld.app.test.ts
|  |  ├── jsonld.blogpublisher.test.ts
|  |  └── jsonld.post.test.ts
|  ├── setup
|  |  ├── console-warn-filter.ts
|  |  └── global-stubs.ts
|  ├── top-analyzer
|  |  ├── export.regress.spec.ts
|  |  └── export.spec.ts
|  ├── unit
|  |  ├── blogVisibility.spec.ts
|  |  ├── frontmatter-visible.spec.ts
|  |  ├── frontmatter.spec.ts
|  |  ├── top.csv.header.test.ts
|  |  └── top.csv.test.ts
|  ├── utils
|  |  ├── cron.dom-dow.mode.test.ts
|  |  ├── cron.extra.test.ts
|  |  ├── cron.humanize.test.ts
|  |  ├── cron.test.ts
|  |  ├── ecdsa.test.ts
|  |  ├── jwt.test.ts
|  |  ├── jwt.verify.test.ts
|  |  ├── time.ts
|  |  └── __snapshots__
|  └── _stubs
|     ├── nuxt-content.ts
|     └── nuxt-imports.ts
├── tree.txt
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── types
|  ├── appconfig.d.ts
|  ├── query-content-global.d.ts
|  ├── query-content.d.ts
|  ├── shims-nuxt-content-server.d.ts
|  ├── shims-nuxt-content.d.ts
|  ├── shims-nuxt-imports.d.ts
|  ├── shims-vue.d.ts
|  └── top.ts
├── utils
|  ├── cron.ts
|  ├── date.ts
|  ├── ecdsa.ts
|  ├── isVisiblePost.ts
|  ├── jwt.ts
|  ├── jwt.ts.bak_refactor
|  ├── resolveBlogDocByRoute.ts
|  ├── siteMeta.ts
|  ├── siteUrl.ts
|  ├── top
|  |  ├── csv.ts
|  |  └── parse.ts
|  └── top-export.ts
├── vercel.json
├── vitest.config.ts
└── workers
   └── topParser.worker.ts

directory: 65 file: 236 symboliclink: 37

