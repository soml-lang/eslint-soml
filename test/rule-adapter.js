/*
The adapter that turns a rule written with `context.on()` into an ESLint rule.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import toEslintRule from '../rules/rule/to-eslint-rule.js';
import plugin from '../index.js';

const fixWith = fix => toEslintRule('test-rule', {
	create(context) {
		context.on('Integer', node => ({node, message: 'Number.', fix: (fixer, options) => fix(fixer, node, options)}));
	},
	meta: {fixable: 'code', languages: ['soml/soml']},
});

const lint = rule => new Linter().verify('a: 1', {
	files: ['**/*.soml'],
	language: 'soml/soml',
	plugins: {soml: plugin, test: {rules: {rule}}},
	rules: {'test/rule': 'error'},
}, {filename: 'file.soml'});

test('a fix may yield `undefined` among its fixes', () => {
	const [message] = lint(fixWith(function * (fixer, node) {
		yield undefined;
		yield fixer.insertTextAfter(node, '0');
		yield fixer.insertTextBefore(node, '1');
	}));

	assert.deepEqual(message.fix, {range: [3, 4], text: '110'});
});

test('an aborted fix gives no fix, even after it yielded one', () => {
	const [message] = lint(fixWith(function * (fixer, node, {abort}) {
		yield fixer.insertTextAfter(node, '0');
		abort();
	}));

	assert.equal(message.message, 'Number.');
	assert.equal(message.fix, undefined);
});
