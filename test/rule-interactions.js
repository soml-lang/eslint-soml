/*
Problems that only show up when rules run together.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import process from 'node:process';
import plugin from '../index.js';
import {
	applyFix,
	canonical,
	filename,
	getConfig,
	lint,
	linter,
} from './utils/lint.js';

const fix = (code, rules) => linter.verifyAndFix(code, getConfig(rules), {filename});

test('diagnostics escape line feeds and tabs in decoded keys', () => {
	for (const [rule, code] of [
		['no-dotted-key-collisions', String.raw`{"a\nb": {}, "a\nb.c\td": 1}`],
		['no-surrounding-whitespace-in-keys', String.raw`" a\nb\tc ": 1`],
		['no-unnormalized-keys', String.raw`"e\u{301}\nx\tkey": 1`],
	]) {
		const messages = lint(code, {[`soml/${rule}`]: 'error'});
		assert.equal(messages.length, 1);
		assert.equal(messages[0].ruleId, `soml/${rule}`);
		assert.doesNotMatch(messages[0].message, /[\t\n]/v);
		assert.match(messages[0].message, /\\(?:n|u\{a\})/v);
		assert.match(messages[0].message, /\\(?:t|u\{9\})/v);
	}
});

test('no-invisible-characters reports every character after prefer-literal-strings ran', () => {
	// `prefer-literal-strings` checks this string for invisible characters, which must not leave state behind.
	lint('a: "q\u{200B}q\u{200B}q\u{200B}q"', {'soml/prefer-literal-strings': 'error'});

	const messages = lint('a: "\u{200B}x"', {'soml/no-invisible-characters': 'error'});
	assert.deepEqual(messages.map(message => message.column), [5]);
});

test('prefer-literal-strings does not create a string that no-doubled-backslashes-in-literal-strings reports', () => {
	const rules = {
		'soml/prefer-literal-strings': 'error',
		'soml/no-doubled-backslashes-in-literal-strings': 'error',
	};

	// The value of `a` has two backslashes, which only `"..."` shows as meant. The value of `b` has one.
	const {output, messages} = fix(String.raw`a: "^\\\\d+$"` + '\n' + String.raw`b: "^\\d+$"`, rules);

	assert.equal(output, String.raw`a: "^\\\\d+$"` + '\n' + String.raw`b: '^\d+$'`);
	assert.deepEqual(messages, []);
});

test('sort-keys sorts a large object in one run', () => {
	const keys = Array.from({length: 30}, (_, index) => `k${String(30 - index).padStart(2, '0')}`);
	const code = keys.map((key, index) => `${key}: ${index}`).join('\n');
	const {output, messages} = fix(code, {'soml/sort-keys': 'error'});

	assert.deepEqual(messages, []);
	assert.equal(output, keys.map((key, index) => `${key}: ${index}`).toReversed().join('\n'));
});

test('natural sorting and formatting preserve block strings and separate key groups', () => {
	const code = 'B10: "first\\nsecond\\nthird"\nb2: {z10: 10, z2: 2}\n\nA10: 10\na2: 2\n';
	const {output, messages} = fix(code, {
		...plugin.configs.recommended.rules,
		'soml/sort-keys': ['error', 'asc', {natural: true, caseSensitive: false, allowLineSeparatedGroups: true}],
	});

	assert.deepEqual(messages, []);
	assert.equal(output, 'b2: {z2: 2, z10: 10}\nB10:\n\t\'\'\'\n\tfirst\n\tsecond\n\tthird\n\t\'\'\'\n\na2: 2\nA10: 10\n');
	assert.equal(canonical(output), canonical(code));
});

// eslint-disable-next-line node-test/require-assertion -- The child process runs the assertions with Temporal absent before the parser is imported.
test('every rule can lint and fix instants and durations without Temporal', () => {
	execFileSync(process.execPath, [fileURLToPath(new URL('utils/without-temporal.js', import.meta.url))]);
});

test('prefer-literal-strings does not create a string that no-escapes-in-literal-strings reports', () => {
	const rules = {
		'soml/prefer-literal-strings': 'error',
		'soml/no-escapes-in-literal-strings': 'error',
	};

	// The values of `a` and `b` have a backslash before the name of an escape, `n` and `u{e9}`, which only `"..."` shows as meant. The value of `c` is a path.
	const code = String.raw`a: "Line one\\nLine two"` + '\n' + String.raw`b: "caf\\u{e9}"` + '\n' + String.raw`c: "src\\test"`;
	const {output, messages} = fix(code, rules);

	assert.equal(output, String.raw`a: "Line one\\nLine two"` + '\n' + String.raw`b: "caf\\u{e9}"` + '\n' + String.raw`c: 'src\test'`);
	assert.deepEqual(messages, []);
});

test('the suggestion of no-escapes-in-literal-strings is a string that no other rule reports', () => {
	const rules = {
		'soml/no-escapes-in-literal-strings': 'error',
		'soml/prefer-literal-strings': 'error',
		'soml/no-invisible-characters': 'error',
		'soml/no-doubled-backslashes-in-literal-strings': 'error',
	};

	for (const code of [
		String.raw`a: 'Line one\nLine two'`,
		String.raw`a: 'caf\u{e9}'`,
		String.raw`a: 'it\u{27}s\n'`,
		String.raw`a: 'x\u{a0}y\n'`,
		'a: \'tab\there\\n\'',
		String.raw`a: 'a\\b and\nc'`,
		String.raw`a: 'Use \\n for a new line, caf\u{e9}'`,
		String.raw`a: 'caf\u{e9} ^\\\\d+$'`,
	]) {
		const [message] = lint(code, rules);
		const suggested = applyFix(code, message.suggestions[0]);

		assert.deepEqual(lint(suggested, rules), [], `${code} → ${suggested}`);
	}
});

test('the block string of prefer-block-strings is one that no other rule reports', () => {
	const allRules = Object.fromEntries(Object.keys(plugin.rules).map(name => [`soml/${name}`, 'error']));
	// `format` and `sort-keys` rewrite the document, which could hide a block string that another rule reports.
	const {'soml/format': format, 'soml/sort-keys': sortKeys, ...rules} = allRules;

	for (const code of [
		String.raw`a: "x\ny\nz"`,
		String.raw`a: "x  \ny\nz"`,
		String.raw`a: "x\n\t\ny\n"`,
		String.raw`a: "\nx\ny\nz\n"`,
		String.raw`a: "a\u{a0}b\nc\nd"`,
		String.raw`a: "^\\\\d+$\nb\nc"`,
		String.raw`a: "a\n'''\nb"`,
		String.raw`a: "x'''\ny\nz"`,
		String.raw`a: "a\n\"\"\"\nb"`,
		String.raw`a: "Say \"hi\"\nand\nbye"`,
		String.raw`a: "C:\\new\ny\nz"`,
		String.raw`a: {b: {c: "x\ny\nz"}}`,
		String.raw`a: [{b: "x\ny\nz"}, "1\n2\n3"]`,
		String.raw`a: "x\ny\nz" # note`,
		String.raw`a: "a\tb\nc\nd"`,
		String.raw`a: "x\ny\nz  \n"`,
	]) {
		for (const ruleSet of [rules, allRules]) {
			const {output, messages} = fix(code, ruleSet);

			assert.deepEqual(messages, [], `${code}\n→\n${output}`);
			assert.equal(canonical(output), canonical(code));
		}
	}
});

test('no-quoted-values-in-arrays does not undo the string suggestion of no-float-trailing-zeros', () => {
	const code = 'python: [3.9, 3.10]';
	const [message] = lint(code, {'soml/no-float-trailing-zeros': 'error'});
	const suggested = applyFix(code, message.suggestions[0]);

	assert.equal(suggested, 'python: [3.9, \'3.10\']');
	assert.deepEqual(lint(suggested, {'soml/no-quoted-values-in-arrays': 'error'}), []);
});

test('no-quoted-values-in-arrays and no-quoted-keywords do not both report one string', () => {
	const rules = {
		'soml/no-quoted-values-in-arrays': 'error',
		'soml/no-quoted-keywords': 'error',
	};

	assert.deepEqual(lint('a: [true, \'false\']', rules).map(message => message.ruleId), ['soml/no-quoted-keywords']);
	assert.deepEqual(lint('a: [1, null, \'null\']', rules).map(message => message.ruleId), ['soml/no-quoted-keywords']);
});

test('a key with whitespace next to the key without it is reported by both key rules', () => {
	const rules = {
		'soml/no-surrounding-whitespace-in-keys': 'error',
		'soml/no-confusable-keys': 'error',
		'soml/no-empty-keys': 'error',
	};

	const messages = lint('timeout: 1s\n\'timeout \': 2s', rules);

	assert.deepEqual(messages.map(message => message.ruleId).toSorted((first, second) => first.localeCompare(second, 'en')), ['soml/no-confusable-keys', 'soml/no-surrounding-whitespace-in-keys']);

	// A key of only whitespace is reported once.
	assert.deepEqual(lint('\' \': 1', rules).map(message => message.ruleId), ['soml/no-empty-keys']);
});

test('no-dotted-key-collisions and no-confusable-keys report different keys', () => {
	const rules = {
		'soml/no-dotted-key-collisions': 'error',
		'soml/no-confusable-keys': 'error',
	};

	const messages = lint('logging: {}\n\'logging.level\': 1\nlogging-level: 2', rules);

	assert.deepEqual(messages.map(({ruleId, line}) => [ruleId, line]), [
		['soml/no-dotted-key-collisions', 2],
		['soml/no-confusable-keys', 3],
	]);
});
