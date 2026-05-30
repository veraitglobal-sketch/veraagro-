const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', 'dist/**', '.expo/**', '*.config.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: { __dirname: 'readonly', module: 'readonly', require: 'readonly', process: 'readonly', console: 'readonly' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['features/grower/**/*.ts', 'features/grower/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['TextInput'],
              message:
                'Grower features must use EnterpriseTextField / EnterpriseTextArea from design-system, not raw TextInput.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='growerUi'][property.name='formInput']",
          message: 'Use EnterpriseTextField from design-system instead of growerUi.formInput.',
        },
      ],
    },
  },
];
