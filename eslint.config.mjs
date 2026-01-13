// https://docs.expo.dev/guides/using-eslint/
import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactCompiler from 'eslint-plugin-react-compiler';
import { defineConfig } from 'eslint/config';

export default defineConfig([
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
