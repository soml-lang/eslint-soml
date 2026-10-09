/*
The snapshot tester catches the mistakes of a rule that it promises to catch.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {toEslintRules} from '../rules/rule/index.js';
import SnapshotRuleTester from './utils/snapshot-rule-tester.js';

/*
Runs a rule through the tester, with a `test` function that runs each case at once and ignores snapshots, and returns the error of each case.
*/
function runTester(create, meta, {valid = [], invalid = []}) {
	const {rule} = toEslintRules({rule: {create, meta: {languages: ['soml/soml'], ...meta}}});
	const errors = [];
	const fakeTest = (name, options, callback) => {
		try {
			callback({assert: {snapshot() {}}});
			errors.push(undefined);
		} catch (error) {
			errors.push(error);
		}
	};

	new SnapshotRuleTester(fakeTest).run('rule', rule, {
		valid: valid.map(code => ({code})),
		invalid: invalid.map(code => ({code})),
	});

	return errors;
}

const reportStrings = problem => context => {
	context.on('String', node => ({node, ...problem(node)}));
};

test('the tester leaves literal placeholders in message templates to the snapshots', () => {
	const errors = runTester(reportStrings(() => ({messageId: 'message'})), {messages: {message: 'Prefer {{missing}}.'}}, {invalid: ['a: \'x\'']});
	assert.deepEqual(errors, [undefined]);
});

test('the tester catches a fix that changes nothing', () => {
	const [error] = runTester(
		context => {
			context.on('String', node => ({node, messageId: 'message', fix: fixer => fixer.replaceText(node, context.sourceCode.getText(node))}));
		},
		{fixable: 'code', messages: {message: 'Message.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.match(error?.message ?? '', /change/v);
});

test('the tester catches a fix that never converges', () => {
	const [error] = runTester(
		reportStrings(node => ({messageId: 'message', fix: fixer => fixer.insertTextAfter(node, ' # c')})),
		{fixable: 'code', messages: {message: 'Message.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.match(error?.message ?? '', /converge/v);
});

test('the tester accepts a rule that does what it should', () => {
	const errors = runTester(
		context => {
			context.on('String', node => node.style === 'escaped'
				? {
					node, messageId: 'message', data: {value: node.value}, fix: fixer => fixer.replaceText(node, `'${node.value}'`),
				}
				: undefined);
		},
		{fixable: 'code', messages: {message: 'Use a literal string for {{value}}.'}},
		{valid: ['a: \'x\''], invalid: ['a: "x"']},
	);
	assert.deepEqual(errors, [undefined, undefined]);
});

test('the tester accepts a message that shows a value with braces from the code', () => {
	const errors = runTester(
		reportStrings(node => ({messageId: 'message', data: {value: node.value}})),
		{messages: {message: '`{{value}}` looks like a placeholder.'}},
		{invalid: ['a: \'{{name}}\'']},
	);
	assert.deepEqual(errors, [undefined]);
});

test('the tester accepts decoded values with braces in messages and suggestions', () => {
	const errors = runTester(
		reportStrings(node => ({messageId: 'message', data: {value: node.value}, suggest: [{messageId: 'suggestion', data: {value: node.value}, fix: fixer => fixer.replaceText(node, '\'real\'')}]})),
		{hasSuggestions: true, messages: {message: '`{{value}}` looks like a placeholder.', suggestion: 'Replace `{{value}}`.'}},
		{invalid: [String.raw`a: "changeme {{na\u{6d}e}}"`, String.raw`a: "changeme {{va\u{6c}ue}}"`]},
	);
	assert.deepEqual(errors, [undefined, undefined]);
});

test('the tester leaves literal placeholders in suggestion templates to the snapshots', () => {
	const errors = runTester(
		reportStrings(node => ({messageId: 'message', suggest: [{messageId: 'suggestion', fix: fixer => fixer.replaceText(node, '\'real\'')}]})),
		{hasSuggestions: true, messages: {message: 'Message.', suggestion: 'Prefer {{missing}}.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.deepEqual(errors, [undefined]);
});

test('the tester checks that later autofix passes keep the document value', () => {
	const [error] = runTester(
		context => {
			context.on('String', node => node.value === 'x'
				? {
					node,
					messageId: 'message',
					fix: fixer => fixer.replaceText(node, node.style === 'literal' ? '"x"' : '\'y\''),
				}
				: undefined);
		},
		{fixable: 'code', messages: {message: 'Message.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.match(error?.message ?? '', /keep the value/v);
});

test('the tester rejects a parse error introduced by a later autofix pass', () => {
	const [error] = runTester(
		context => {
			context.on('String', node => node.value === 'x'
				? {
					node,
					messageId: 'message',
					fix: fixer => fixer.replaceText(node, node.style === 'literal' ? '"x"' : 'oops'),
				}
				: undefined);
		},
		{fixable: 'code', messages: {message: 'Message.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.ok(error instanceof SyntaxError);
});

test('the tester accepts converging value-preserving fixes across multiple passes', () => {
	const spellings = new Set();
	const replacements = new Map([
		['\'x\'', '"x"'],
		['"x"', String.raw`"\u{78}"`],
	]);
	const errors = runTester(
		context => {
			context.on('String', node => {
				const text = context.sourceCode.getText(node);
				spellings.add(text);
				const replacement = replacements.get(text);
				if (replacement === undefined) {
					return;
				}

				return {node, messageId: 'message', fix: fixer => fixer.replaceText(node, replacement)};
			});
		},
		{fixable: 'code', messages: {message: 'Message.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.deepEqual(errors, [undefined]);
	assert.deepEqual([...spellings], ['\'x\'', '"x"', String.raw`"\u{78}"`]);
});

test('the tester accepts a remaining problem without an autofix', () => {
	const errors = runTester(
		reportStrings(node => ({
			messageId: 'message',
			fix: node.style === 'literal' ? fixer => fixer.replaceText(node, '"x"') : undefined,
		})),
		{fixable: 'code', messages: {message: 'Message.'}},
		{invalid: ['a: \'x\'']},
	);
	assert.deepEqual(errors, [undefined]);
});
