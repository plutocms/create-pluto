// @ts-check
import antfu from '@antfu/eslint-config'
import prettier from 'eslint-config-prettier'

export default antfu(
  {
    // Prettier formats the code (format on save, `bun run prettier`). ESLint checks the code,
    // not its layout, so the two never undo each other.
    stylistic: false,
    ignores: ['**/*.md', '.github/**'],

    rules: {
      // The tests use the built-in node:test runner. The project has no vitest.
      'test/no-import-node-test': 'off',

      'node/prefer-global/process': ['off', 'never'],

      'antfu/no-top-level-await': 'off',
    },
  },
  // Last: turns off every rule that Prettier covers (the Vue template layout rules too).
  prettier
)
