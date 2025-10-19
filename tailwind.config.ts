import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
export default <Config>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    './content/**/*.md',
  ],
  theme: {
    extend: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.zinc.800'),
            '--tw-prose-headings': theme('colors.zinc.900'),
            '--tw-prose-links': theme('colors.blue.700'),
            '--tw-prose-bold': theme('colors.zinc.900'),
            '--tw-prose-counters': theme('colors.zinc.600'),
            '--tw-prose-bullets': theme('colors.zinc.600'),
            '--tw-prose-hr': theme('colors.zinc.200'),
            '--tw-prose-quotes': theme('colors.zinc.900'),
            '--tw-prose-quote-borders': theme('colors.zinc.200'),
            '--tw-prose-captions': theme('colors.zinc.600'),
            '--tw-prose-code': theme('colors.zinc.900'),
            '--tw-prose-pre-code': theme('colors.zinc.200'),
            '--tw-prose-pre-bg': theme('colors.zinc.900'),
            '--tw-prose-th-borders': theme('colors.zinc.300'),
            '--tw-prose-td-borders': theme('colors.zinc.200'),
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.zinc.200'),
            '--tw-prose-headings': theme('colors.zinc.100'),
            '--tw-prose-links': theme('colors.sky.400'),
            '--tw-prose-bold': theme('colors.zinc.100'),
            '--tw-prose-counters': theme('colors.zinc.500'),
            '--tw-prose-bullets': theme('colors.zinc.500'),
            '--tw-prose-hr': theme('colors.zinc.700'),
            '--tw-prose-quotes': theme('colors.zinc.100'),
            '--tw-prose-quote-borders': theme('colors.zinc.700'),
            '--tw-prose-captions': theme('colors.zinc.400'),
            '--tw-prose-code': theme('colors.zinc.100'),
            '--tw-prose-pre-code': theme('colors.zinc.200'),
            '--tw-prose-pre-bg': theme('colors.zinc.950'),
            '--tw-prose-th-borders': theme('colors.zinc.700'),
            '--tw-prose-td-borders': theme('colors.zinc.800'),
          },
        },
      }),
    },
  },
  plugins: [typography],
}
