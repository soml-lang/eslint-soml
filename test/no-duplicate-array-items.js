import assert from 'node:assert/strict';
import {test as nodeTest} from 'node:test';
import {parse} from 'soml-lang';
import outdent from 'outdent';
import {applyFix, canonical, lint} from './utils/lint.js';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'hosts: [\'a\', \'b\']',
		'weights: [0, 0, 1]',
		'flags: [true, true]',
		'a: [[\'x\'], [\'x\']]',
		'a: [\'x\']\nb: [\'x\']',
		'a: [\'a\', \'A\']',
		'dates: [0001-01-01, 9999-12-31, 1582-10-10]',
		'dates: [2000-01-01, 2000-01-02, 2000-02-01]',
		'dates: [2000-02-29, \'2000-02-29\', \'2000-2-29\']',
		'dates: [[2000-02-29], [2000-02-29]]',
		'instants: [2000-02-29T00:00:00Z, 2000-02-29T00:00:00Z]',
		'durations: [1s, 1s]\nmissing: [null, null]',
	],
	invalid: [
		'hosts: [\'a\', \'b\', \'a\']',
		'hosts: [\'a\', \'a\', \'b\']',
		'hosts: [\'a\', \'b\', \'a\',]',
		'hosts: [\'a\', "a"]',
		'hosts: [\'a\', \'a\', \'a\']',
		String.raw`["a", '\u{61}', "\u{61}"]`,
		outdent`
			hosts: [
				'a',
				'b',
				'a',
			]
		`,
		outdent`
			hosts: [
				'a',
				'a',
				'b',
			]
		`,
		outdent`
			hosts: [
				'a',
				'a', # The second one
				'b',
			]
		`,
		// Items that line breaks separate, with or without commas.
		outdent`
			hosts: [
				'a'
				'b'
				'a'
			]
		`,
		outdent`
			hosts: [
				'a'
				'a'
				'b'
			]
		`,
		'hosts: [\'a\', \'a\'\n\'b\']',
		'hosts: [\'a\'\n\'a\', \'b\']',
		'hosts: [\n\t\'a\'\n\t\'a\' # c\n]',
		// No suggestion, because a comment is next to the item.
		'a: [\'a\', \'a\' # c\n]',
		'a: [\'a\', \'a\', # c\n]',
		// A block string is shown on one line.
		'a: [\n\t\'x\'\n\t"""\n\tx\n\t"""\n]',
		'a: [\n\t\'\'\'\n\tone\n\ttwo\n\t\'\'\'\n\t"one\\ntwo"\n\t\'\'\'\n\tone\n\ttwo\n\t\'\'\'\n]',
		// An escaped bidirectional character stays escaped in the message.
		String.raw`a: ["x\u{202e}y", """` + '\n\tx' + String.raw`\u{202e}` + 'y\n\t"""]',
		// So does a raw one in a plain string.
		'a: [\'\u{202E}x\', \'\u{202E}x\']',
		'dates: [1582-10-10, 2011-12-30, 1582-10-10]',
		'[0001-01-01, 0001-01-01, 0001-01-01]',
		'{\'a.b\': [9999-12-31, 9999-12-31,]}',
		'[[2000-02-29, 2000-02-29]]',
		'[2000-02-29, \'2000-02-29\', 2000-02-29, \'2000-02-29\']',
		'dates: [\n\t1582-10-10\n\t1582-10-10\n]',
		'dates: [1582-10-10, /* keep */ 1582-10-10]',
		'dates: [1582-10-10, 1582-10-10 # keep\n]',
	],
});

nodeTest('removing a duplicate preserves the other items across array separator styles', () => {
	const itemLists = ['\'a\'', String.raw`"\u{61}"`, '\'\'\'\na\n\'\'\'']
		.flatMap(duplicate => [['\'a\'', '\'b\'', duplicate], ['\'a\'', duplicate, '\'b\'']]);

	for (const firstSeparator of [', ', ',\n\t', '\n\t']) {
		for (const secondSeparator of [', ', ',\n\t', '\n\t']) {
			for (const trailingComma of ['', ',']) {
				for (const items of itemLists) {
					const code = `[${items[0]}${firstSeparator}${items[1]}${secondSeparator}${items[2]}${trailingComma}]`;
					const messages = lint(code, {'soml/no-duplicate-array-items': 'error'});
					assert.equal(messages.length, 1, code);
					assert.equal(messages[0].messageId, 'no-duplicate-array-items/error');
					assert.equal(messages[0].suggestions.length, 1);
					const output = applyFix(code, messages[0].suggestions[0]);
					assert.deepEqual(parse(output), ['a', 'b'], output);
					assert.deepEqual(lint(output, {'soml/no-duplicate-array-items': 'error'}), []);
				}
			}
		}
	}
});

nodeTest('duplicate dates preserve native types and other items when removed by suggestion', () => {
	for (const date of ['0001-01-01', '9999-12-31', '1582-10-10', '2011-12-30', '2000-02-29']) {
		const code = `[${date}, 2026-11-01, ${date}]`;
		const messages = lint(code, {'soml/no-duplicate-array-items': 'error'});
		assert.equal(messages.length, 1, code);
		assert.equal(messages[0].messageId, 'no-duplicate-array-items/error');
		assert.equal(messages[0].fix, undefined);
		assert.equal(messages[0].suggestions.length, 1);
		const output = applyFix(code, messages[0].suggestions[0]);
		assert.equal(canonical(output), canonical(`[${date}, 2026-11-01]`));
		assert.deepEqual(lint(output, {'soml/no-duplicate-array-items': 'error'}), []);
	}
});

nodeTest('date and string duplicates are reported independently', () => {
	const messages = lint('[2000-02-29, \'2000-02-29\', 2000-02-29, \'2000-02-29\']', {'soml/no-duplicate-array-items': 'error'});
	assert.equal(messages.length, 2);
	assert.equal(messages[0].message, '`2000-02-29` is already in this array, on line 1.');
	assert.equal(messages[1].message, '`\'2000-02-29\'` is already in this array, on line 1.');
});
