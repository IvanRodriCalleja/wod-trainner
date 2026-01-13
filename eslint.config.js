// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactCompiler = require('eslint-plugin-react-compiler');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = defineConfig([
	{
		extends: [expoConfig],
		rules: {
			'@typescript-eslint/no-unused-vars': 'error',
			'react/no-unescaped-entities': 'off'
		}
	},
	reactCompiler.configs.recommended,
	prettierConfig,
	{
		plugins: { prettier: prettierPlugin },
		rules: {
			'prettier/prettier': [
				'error',
				{
					endOfLine: 'auto'
				}
			]
		}
	},
	{
		ignores: ['dist/*'],
		rules: {
			'no-console': 'off',
			'no-debugger': 'off',
			'no-alert': 'error',
			'no-empty-function': 'off',
			'require-await': 'error',
			'no-duplicate-imports': 'error',
			'no-dupe-class-members': 'error',
			'no-multiple-empty-lines': 'error',
			'no-array-constructor': 'error',
			'prefer-const': 'error',
			'one-var': [
				'error',
				{
					let: 'never',
					const: 'never'
				}
			],
			'prefer-destructuring': 'off',
			'prefer-object-spread': 'error',
			'prefer-rest-params': 'error'
		}
	}
]);
