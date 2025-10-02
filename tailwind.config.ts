import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
export default <Config>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    './content/**/*.md',
  ],
  theme: { extend: {} },
  plugins: [typography],
}
