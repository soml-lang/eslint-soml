import * as rawRules from './rules/index.js';
import {toEslintRules} from './rules/rule/index.js';
import SomlLanguage from './language/soml-language.js';
import packageJson from './package.json' with {type: 'json'};

const rules = toEslintRules(rawRules);

const createRules = shouldEnable => Object.fromEntries(Object.entries(rules).map(([id, rule]) => [
	`soml/${id}`,
	shouldEnable(rule) ? 'error' : 'off',
]));

const recommendedRules = createRules(rule => Boolean(rule.meta.docs.recommended));
const unopinionatedRules = createRules(rule => rule.meta.docs.recommended === 'unopinionated');
const allRules = createRules(() => true);

const createConfig = (rules, flatConfigName) => ({
	name: flatConfigName,
	files: ['**/*.soml'],
	plugins: {
		soml,
	},
	language: 'soml/soml',
	rules,
});

const soml = {
	meta: {
		// `eslint-doc-generator` derives the rule prefix from this name, expecting either the `eslint-plugin-<prefix>` convention or the prefix itself. The package name does not follow that convention, so this is the prefix.
		name: 'soml',
		namespace: 'soml',
		version: packageJson.version,
	},
	languages: {
		soml: new SomlLanguage(),
	},
	rules,
};

const configs = {
	recommended: createConfig(recommendedRules, 'soml/recommended'),
	unopinionated: createConfig(unopinionatedRules, 'soml/unopinionated'),
	all: createConfig(allRules, 'soml/all'),
};

soml.configs = configs;

export default soml;
