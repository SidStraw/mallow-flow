import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt()
  .override('nuxt/vue/rules', {
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  })
  .override('nuxt/rules', {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  })
