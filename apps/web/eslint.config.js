// @ts-check
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import rootConfig from '../../eslint.config.mjs'

export default tseslint.config(...rootConfig, {
  files: ['**/*.{ts,tsx}'],
  extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
})
