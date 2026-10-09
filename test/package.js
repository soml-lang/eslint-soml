import fs, {promises as fsAsync} from 'node:fs';
import path from 'node:path';
import test, {before} from 'node:test';
import assert from 'node:assert/strict';
import {ESLint} from 'eslint';
import {defineConfig} from 'eslint/config';
import eslintSoml from '../index.js';

let ruleFiles;

before(async () => {
	const files = await fsAsync.readdir('rules');
	ruleFiles = files.filter(file => path.extname(file) === '.js' && path.basename(file) !== 'index.js');
});

test('Every rule is defined in index file in alphabetical order', () => {
	const names = Object.keys(eslintSoml.rules);
	assert.deepEqual(names, names.toSorted((first, second) => first.localeCompare(second, 'en')), 'The rules in `rules/index.js` are not in alphabetical order.');

	for (const file of ruleFiles) {
		const name = path.basename(file, '.js');
		assert.ok(eslintSoml.rules[name], `'${name}' is not exported in 'index.js'`);

		const documentationPath = path.join('docs/rules', `${name}.md`);
		const testPath = path.join('test', file);

		assert.ok(fs.existsSync(documentationPath), `There is no documentation for '${name}'`);
		assert.ok(fs.existsSync(testPath), `There are no tests for '${name}'`);
	}

	assert.equal(
		Object.keys(eslintSoml.rules).length,
		ruleFiles.length,
		'There are more exported rules than rule files.',
	);

	for (const [configName, config] of Object.entries(eslintSoml.configs)) {
		assert.equal(
			Object.keys(config.rules).length,
			ruleFiles.length,
			`The ${configName} config does not list every rule.`,
		);
	}
});

test('Every rule only supports SOML', () => {
	for (const [name, rule] of Object.entries(eslintSoml.rules)) {
		assert.deepEqual(rule.meta.languages, ['soml/soml'], `'${name}' should only support SOML.`);
	}
});

test('validate configuration', async () => {
	const results = await Promise.all(Object.entries(eslintSoml.configs).map(async ([name, config]) => {
		const eslint = new ESLint({
			baseConfig: config,
			overrideConfigFile: true,
		});

		const result = await eslint.calculateConfigForFile('dummy.soml');

		return {name, config, result};
	}));

	for (const {name, config, result} of results) {
		assert.deepEqual(
			Object.keys(result.rules),
			Object.keys(config.rules),
			`Configuration for "${name}" is invalid.`,
		);
	}
});

test('preset configs only apply to SOML files', () => {
	for (const config of Object.values(eslintSoml.configs)) {
		assert.deepEqual(config.files, ['**/*.soml']);
		assert.equal(config.language, 'soml/soml');
	}
});

test('the plugin provides the language', () => {
	assert.equal(typeof eslintSoml.languages.soml.parse, 'function');
});

test('all config works on its own and reports parsing errors', async () => {
	const eslint = new ESLint({
		baseConfig: eslintSoml.configs.all,
		overrideConfigFile: true,
	});

	const [valid] = await eslint.lintText('name: \'soml\'\n', {filePath: 'file.soml'});
	assert.deepEqual(valid.messages, []);

	const [invalid] = await eslint.lintText('name: soml\n', {filePath: 'file.soml'});
	assert.equal(invalid.messages.length, 1);
	assert.equal(invalid.messages[0].fatal, true);
	assert.match(invalid.messages[0].message, /^Parsing error: /v);
});

test('recommended config works with defineConfig', async () => {
	const eslint = new ESLint({
		baseConfig: defineConfig({
			files: ['**/*.soml'],
			plugins: {
				soml: eslintSoml,
			},
			extends: [
				'soml/recommended',
			],
		}),
		overrideConfigFile: true,
	});

	const [result] = await eslint.lintText('a: "b"\n', {filePath: 'file.soml'});
	assert.deepEqual(result.messages.map(message => message.ruleId), ['soml/prefer-literal-strings']);
});

test('Every rule has valid meta.type', () => {
	const validTypes = ['problem', 'suggestion', 'layout'];

	for (const file of ruleFiles) {
		const name = path.basename(file, '.js');
		const rule = eslintSoml.rules[name];

		assert.ok(validTypes.includes(rule.meta.type), `${name} meta.type is not one of [${validTypes.join(', ')}]`);
	}
});

test('Every option object of a rule rejects unknown options', () => {
	for (const [name, rule] of Object.entries(eslintSoml.rules)) {
		for (const option of rule.meta.schema) {
			if (option.type === 'object') {
				assert.equal(option.additionalProperties, false, `An option of ${name} accepts unknown properties, so a typo in an option name is silently ignored.`);
			}
		}
	}
});

test('Every rule file has the appropriate contents', () => {
	for (const ruleFile of ruleFiles) {
		const ruleName = path.basename(ruleFile, '.js');
		const rulePath = path.join('rules', `${ruleName}.js`);
		const ruleContents = fs.readFileSync(rulePath, 'utf8');

		assert.match(
			ruleContents,
			/\/\*\*\s*@type \{SomlRule\}\s*\*\//v,
			`${ruleName} includes jsdoc comment for rule type`,
		);
	}
});

test('Every rule has a doc with the appropriate content', () => {
	for (const ruleFile of ruleFiles) {
		const ruleName = path.basename(ruleFile, '.js');
		const documentPath = path.join('docs/rules', `${ruleName}.md`);
		const documentContents = fs.readFileSync(documentPath, 'utf8');

		// Check for examples.
		assert.equal(documentContents.includes('## Examples'), true, `${ruleName} includes '## Examples' examples section`);
	}
});

test('Plugin should have metadata', () => {
	assert.equal(typeof eslintSoml.meta.name, 'string');
	assert.equal(typeof eslintSoml.meta.version, 'string');
});

for (const namespace of ['config', '@example/config']) {
	test(`the plugin can use the namespace ${namespace}`, async () => {
		const eslint = new ESLint({
			baseConfig: {
				files: ['**/*.soml'],
				plugins: {[namespace]: eslintSoml},
				language: `${namespace}/soml`,
				rules: {
					[`${namespace}/format`]: 'error',
					[`${namespace}/prefer-literal-strings`]: 'error',
				},
			},
			overrideConfigFile: true,
			fix: true,
		});
		const [result] = await eslint.lintText('a:"b"\n', {filePath: 'file.soml'});
		assert.deepEqual(result.messages, []);
		assert.equal(result.output, 'a: \'b\'\n');

		const disabled = `z:1\na:"b" # eslint-disable-line ${namespace}/format`;
		const [disabledResult] = await eslint.lintText(disabled, {filePath: 'file.soml'});
		assert.deepEqual(disabledResult.messages.map(({ruleId, line}) => ({ruleId, line})), [{ruleId: `${namespace}/format`, line: 1}]);
		assert.equal(disabledResult.output, disabled.replace('"b"', '\'b\''));

		const quoted = `a:"b" # eslint-disable-line ${namespace}/prefer-literal-strings`;
		const [quotedResult] = await eslint.lintText(quoted, {filePath: 'file.soml'});
		assert.deepEqual(quotedResult.messages, []);
		assert.equal(quotedResult.output, `a: "b" # eslint-disable-line ${namespace}/prefer-literal-strings\n`);
	});
}

test('aliased rules still reject JavaScript files', async () => {
	const eslint = new ESLint({
		baseConfig: {
			plugins: {config: eslintSoml},
			rules: {'config/format': 'error'},
		},
		overrideConfigFile: true,
	});
	await assert.rejects(eslint.lintText('const value = 1;', {filePath: 'file.js'}), /do not support the language "js\/js"/v);
});

// Rules that cannot work well in normal projects. Every other rule belongs in `recommended`.
const RULES_NOT_RECOMMENDED = new Set([
	// Key order is often meaningful to the reader, so sorting is a project choice.
	'sort-keys',
	// The right casing depends on the program that reads the file.
	'key-name-casing',
	// An offset often carries information, such as the local time of an event.
	'prefer-utc-instants',
	// Some string arrays repeat on purpose, such as command line arguments.
	'no-duplicate-array-items',
]);

test('Every rule is recommended unless listed as an exception', () => {
	for (const [name, rule] of Object.entries(eslintSoml.rules)) {
		assert.equal(Boolean(rule.meta.docs.recommended), !RULES_NOT_RECOMMENDED.has(name), `'${name}' has the wrong recommended level.`);
	}
});

test('rule.meta.docs.recommended should be synchronized with presets', () => {
	for (const [name, rule] of Object.entries(eslintSoml.rules)) {
		const {recommended} = rule.meta.docs;
		assert.equal(typeof recommended === 'boolean' || recommended === 'unopinionated', true, `meta.docs.recommended in '${name}' rule should be a boolean or 'unopinionated'.`);

		const recommendedSeverity = eslintSoml.configs.recommended.rules[`soml/${name}`];
		assert.equal(recommendedSeverity, recommended ? 'error' : 'off', `'${name}' rule should have the correct severity in the recommended config.`);

		const unopinionatedSeverity = eslintSoml.configs.unopinionated.rules[`soml/${name}`];
		assert.equal(unopinionatedSeverity, recommended === 'unopinionated' ? 'error' : 'off', `'${name}' rule should have the correct severity in the unopinionated config.`);
	}
});
