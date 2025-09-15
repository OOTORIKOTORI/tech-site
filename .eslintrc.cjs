/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  rules: {
    // Vue style noise off (keep CI green)
    'vue/singleline-html-element-content-newline': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-self-closing': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/multi-word-component-names': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.*', 'tests/**/*'],
      env: { node: true },
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly' },
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
    {
      files: ['pages/**/*.{ts,vue}', 'components/**/*.{ts,vue}'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
}
