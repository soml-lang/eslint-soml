import assert from 'node:assert/strict';
import {test as nodeTest} from 'node:test';
import outdent from 'outdent';
import {getTester} from './utils/test.js';
import {lint} from './utils/lint.js';

const {test} = getTester(import.meta);

nodeTest('sort-keys does not move comments inside members', () => {
	for (const code of [
		'b: {\n\tx: 1 # Explanation\n}\na: 2',
		'b: /* Explanation */ 1\na: 2',
		'b: [/* Explanation */ 1]\na: 2',
		'c: 1\na: [/* Explanation */ 2]\nb: 3',
	]) {
		const messages = lint(code, {'soml/sort-keys': 'error'});
		assert.equal(messages.length, 1);
		assert.equal(messages[0].messageId, 'sort-keys');
		assert.equal(messages[0].fix, undefined);
	}
});

nodeTest('sort-keys can fix when a commented member stays in place', () => {
	const messages = lint('c: 1\nb: [/* Explanation */ 2]\na: 3', {'soml/sort-keys': 'error'});
	assert.equal(messages.length, 2);
	assert.equal(messages[0].fix?.text, 'a: 3\nb: [/* Explanation */ 2]\nc: 1');
});

test.snapshot({
	valid: [
		'a: 1\nb: 2\nc: 3',
		'a: {b: 1, c: 2}',
		'\'a\': 1\nb: 2',
		'\'a.b\': 1\n\'a.c\': 2\nb: 1',
		'B: 1\na: 1',
		'[{b: 1}, {a: 1}]',
		'b: 1',
		'a10: 1\na2: 2',
		// By code point, as canonical form sorts, so U+FF61 comes before an emoji, which starts with a lower UTF-16 code unit.
		String.raw`"\u{ff61}": 1` + '\n' + String.raw`"\u{1f600}": 2`,
		{
			code: 'c: 1\nb: 2\na: 3',
			options: ['desc'],
		},
		{
			code: 'a: 1\nB: 2',
			options: ['asc', {caseSensitive: false}],
		},
		{
			code: 'a2: 1\na10: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: 'b: 1\na: 2',
			options: ['asc', {minKeys: 3}],
		},
		{
			code: outdent`
				b: 1
				c: 2

				a: 3
			`,
			options: ['asc', {allowLineSeparatedGroups: true}],
		},
		// Numbers too large for a float are still told apart.
		{
			code: 'id9007199254740992: 1\nid9007199254740993: 2',
			options: ['asc', {natural: true}],
		},
		// A number with leading zeros is sorted by its value.
		{
			code: 'a9: 1\na010: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: 'a01: 1\na1: 2\na2: 3',
			options: ['asc', {natural: true}],
		},
		// Apart from numbers, keys are compared by code point, as without `natural`.
		{
			code: 'a-b: 1\na_b: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: 'aB: 1\na_b: 2\nab: 3',
			options: ['asc', {natural: true}],
		},
		{
			code: String.raw`"\u{ff61}": 1` + '\n' + String.raw`"\u{1f600}": 2`,
			options: ['asc', {natural: true}],
		},
		{
			code: 'a: 1\na1: 2\na1b: 3\na2: 4\na10: 5\nab: 6',
			options: ['asc', {natural: true}],
		},
		{
			code: 'a10: 1\na2: 2\na1: 3',
			options: ['desc', {natural: true}],
		},
		// A line with a comment between the groups is not blank, but the blank line is.
		{
			code: 'b: 1\n\n# Next group\na: 2',
			options: ['asc', {allowLineSeparatedGroups: true}],
		},
		// Keys that are the same apart from case.
		{
			code: 'a: 1\nA: 2',
			options: ['asc', {caseSensitive: false}],
		},
	],
	invalid: [
		'b: 1\na: 2',
		'a: {c: 1, b: 2}',
		// Members that line breaks separate.
		'a: {\n\tc: 1\n\tb: 2\n}',
		'b: 1\n\'a\': 2',
		'\'b.c\': 1\na: 2',
		'a: 1\nB: 2',
		'c: 1\nb: 2\na: 3',
		{
			code: 'a: 1\nb: 2',
			options: ['desc'],
		},
		{
			code: 'a10: 1\na2: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: 'B: 1\na: 2',
			options: ['asc', {caseSensitive: false}],
		},
		String.raw`"\u{1f600}": 1` + '\n' + String.raw`"\u{ff61}": 2`,
		// A comment next to a member is not moved, so there is no autofix.
		outdent`
			b: 1 # About b
			a: 2
		`,
		outdent`
			# About b
			b: 1
			a: 2
		`,
		{
			code: outdent`
				b: 1
				# Not a blank line
				a: 2
			`,
			options: ['asc', {allowLineSeparatedGroups: true}],
		},
		{
			// An empty line inside a block comment is not a blank line.
			code: outdent`
				b: 1
				/*

				*/
				a: 2
			`,
			options: ['asc', {allowLineSeparatedGroups: true}],
		},
		outdent`
			a: {
				c: [1, 2],
				b: {
					y: 1,
				},
			}
		`,
		{
			code: 'id9007199254740993: 1\nid9007199254740992: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: '12345678901234567891: 1\n12345678901234567890: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: 'a010: 1\na9: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: 'a_b: 1\na-b: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: String.raw`"\u{1f600}": 1` + '\n' + String.raw`"\u{ff61}": 2`,
			options: ['asc', {natural: true}],
		},
		// When only the leading zeros differ, code point order decides.
		{
			code: 'a1: 1\na01: 2',
			options: ['asc', {natural: true}],
		},
		// A large number in the middle of a key is compared by value too.
		{
			code: 'id9007199254740993a: 1\nid9007199254740992b: 2',
			options: ['asc', {natural: true}],
		},
		{
			code: '\'😀2\': 1\n\'😀10\': 2\n\'😀1\': 3',
			options: ['asc', {natural: true}],
		},
		// A blank line after the second member does not separate it from the first.
		{
			code: 'b: 1\na: 2\n\nc: 3',
			options: ['asc', {allowLineSeparatedGroups: true}],
		},
		// Without the option, a blank line does not start a group.
		'b: 1\n\na: 2',
		// A key that another key starts with comes first.
		{
			code: 'ab: 1\na: 2\nabc: 3',
			options: ['asc', {natural: true}],
		},
		// A raw bidirectional control in a key is escaped in the message.
		'a: {\'\u{202E}A\': 1, z: 2}',
	],
});
