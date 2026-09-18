// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier'

export default withNuxt(
  {
    name: 'jinyu-planet/ignores',
    ignores: [
      'public/**',
      '**/dist/**',
      'coverage/**',
      'build/**',
      'docs/**',
    ],
  },
  {
    name: 'jinyu-planet/rules',
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prefer-const': 'warn',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
    },
  },
  eslintConfigPrettier,
)
