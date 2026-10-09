import xo from 'eslint-config-xo';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import nodeStyleTextConfig from 'node-style-text/eslint-config';
import internalRules from './scripts/internal-rules/index.js';

const disabledJsdocRules = Object.fromEntries(
	Object.keys(jsdocPlugin.rules).map(name => [`jsdoc/${name}`, 'off']),
);

const config = [
	...xo(),
	nodeStyleTextConfig,
	internalRules,
	{
		ignores: [
			'**/*.ts',
			// Scratch files from agent sessions and the projects that `test/rename-rule.js` writes.
			'.ai-temporary/',
			'.claude/',
		],
	},
	{
		rules: disabledJsdocRules,
	},
	{
		files: ['**/*.js'],
		rules: {
			'no-shadow': 'off',
			'node-test/no-conditional-assertion': 'off',
			// It reports every guard clause, an `if` that returns followed by a `return`, which reads better than a ternary.
			'unicorn/prefer-ternary': 'off',
			// Tests import shared helpers from `test/utils/`, and the rule counts every file under a `test` directory as a test file.
			'node-test/no-import-test-files': 'off',
		},
	},
	{
		files: [
			'test/utils/*.js',
		],
		rules: {
			// Test helpers export utilities and configure `node:test` and `RuleTester` when they are loaded.
			'node-test/no-export': 'off',
			'unicorn/no-top-level-side-effects': 'off',
		},
	},
	{
		files: [
			'rules/*.js',
		],
		plugins: {
			'eslint-plugin': eslintPlugin,
		},
		rules: {
			...eslintPlugin.configs.all.rules,
			'eslint-plugin/require-meta-docs-description': [
				'error',
				{
					pattern: '.+',
				},
			],
			'eslint-plugin/require-meta-docs-recommended': [
				'error',
				{
					allowNonBoolean: true,
				},
			],
			'eslint-plugin/require-meta-docs-url': 'off',
			'eslint-plugin/require-meta-has-suggestions': 'off',
			'eslint-plugin/require-meta-schema': 'off',
		},
	},
];

export default config;
