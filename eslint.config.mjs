import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },
  // Architecture: component styling must go through CSS Modules. Global SCSS is
  // loaded exactly once (via styles/main.scss in the renderer entry); importing
  // any other non-module stylesheet into a component is disallowed.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.scss', '!**/*.module.scss'],
              message:
                'Import component styles from a *.module.scss file. Global SCSS is loaded once via styles/main.scss (renderer entry only).'
            },
            {
              group: ['**/*.css'],
              message:
                'Use SCSS (*.module.scss for components; styles/main.scss for globals), not plain CSS.'
            }
          ]
        }
      ]
    }
  },
  // The renderer entry is the single sanctioned importer of the global sheet.
  {
    files: ['**/renderer/src/main.tsx'],
    rules: {
      'no-restricted-imports': 'off'
    }
  },
  eslintConfigPrettier
)
