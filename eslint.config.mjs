// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['**/*.md', '.github/**'],

  rules: {
    // The tests use the built-in node:test runner. The project has no vitest.
    'test/no-import-node-test': 'off',

    'node/prefer-global/process': ['off', 'never'],

    'style/arrow-parens': ['warn', 'always'],

    'style/brace-style': ['warn', '1tbs'],

    'style/comma-dangle': [
      'warn',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        functions: 'never',
        imports: 'always-multiline',
      },
    ],

    'style/operator-linebreak': 'off',

    // This CLI's entry point is a top-level script, not a module with a main()
    // wrapper, so top-level await is the idiomatic way to run it.
    'antfu/no-top-level-await': 'off',
  },
})
