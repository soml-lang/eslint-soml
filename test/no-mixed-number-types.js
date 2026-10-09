import assert from 'node:assert/strict';
import {test as nodeTest} from 'node:test';
import {parse} from 'soml-lang';
import {applyFix, lint} from './utils/lint.js';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'ratios: [0.25, 0.5, 1.0]',
		'ports: [80, 443]',
		'a: [1, \'2\', true, null]',
		'a: [1.5, \'2\', 1h]',
		'a: [[1], [2.5]]',
		'a: {b: 1, c: 2.5}',
		'a: []',
		'[1, 2]',
		'a: [1, 2, 3] # ints',
		'a: [-infinity, 0.5]',
	],
	invalid: [
		'ratios: [0.25, 0.5, 1]',
		'ratios: [0.5, 1, 1_000, -2]',
		'ports: [80, 443, 8080.5]',
		'limits: [10, infinity]',
		'a: [0.5, 0xFF]',
		'a: [1, 2.5, \'x\', 3.5]',
		'[1, 2.5]',
		'a: [[0.5, 1]]',
		// A float cannot hold this int exactly, so there is no suggestion.
		'a: [0.5, 9007199254740993]',
		// More than one number of the fewer kind, so the message must not say that the other numbers are all of the other kind.
		'weights: [1, 2, 0.5, 1.5]',
		'ports: [80, 443, 8080.0, 9090.0, 3000]',
		// As many of each, so the ints are reported.
		'a: [1, 2, 0.5, 1.5]',
		'a: [1, 0.5]',
		'a: [\n\t1.5, # ratio\n\t2\n]',
		'a: {b: [1.5, 2, 3.5]}',
		'a: [0.5, 0.25, 1_000]',
	],
});

nodeTest('float suggestions preserve integers at the int64 boundaries', () => {
	for (const [integer, canSuggest] of [
		['-9223372036854775808', true],
		['9223372036854774784', true],
		['9223372036854775807', false],
		['-9223372036854775807', false],
		['9007199254740993', false],
		['-9007199254740993', false],
	]) {
		const code = `[0.5, ${integer}]`;
		const rules = {'soml/no-mixed-number-types': 'error'};
		const messages = lint(code, rules);
		assert.equal(messages.length, 1, code);
		assert.equal(messages[0].messageId, 'no-mixed-number-types/int');
		const suggestions = messages[0].suggestions ?? [];
		assert.equal(suggestions.length, canSuggest ? 1 : 0, code);
		if (!canSuggest) {
			continue;
		}

		const output = applyFix(code, suggestions[0]);
		const [, value] = parse(output);
		assert.equal(typeof value, 'number');
		assert.equal(BigInt(value), BigInt(integer));
		assert.deepEqual(lint(output, rules), []);
	}
});
