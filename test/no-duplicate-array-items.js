import assert from 'node:assert/strict';
import {test as nodeTest} from 'node:test';
import {parse} from 'soml-lang';
import outdent from 'outdent';
import {applyFix, lint} from './utils/lint.js';
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
