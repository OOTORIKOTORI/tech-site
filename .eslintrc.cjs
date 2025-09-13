module.exports = {
  root: true,
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    // Vue rules
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // Prettier integration
    'prettier/prettier': 'error',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  globals: {
    $fetch: 'readonly',
    navigateTo: 'readonly',
    useRoute: 'readonly',
    useRouter: 'readonly',
    useState: 'readonly',
    useFetch: 'readonly',
    useLazyFetch: 'readonly',
    useAsyncData: 'readonly',
    useLazyAsyncData: 'readonly',
    useHead: 'readonly',
    useSeoMeta: 'readonly',
    definePageMeta: 'readonly',
    defineNuxtConfig: 'readonly',
    defineNuxtPlugin: 'readonly',
    defineNuxtRouteMiddleware: 'readonly',
  },
}
