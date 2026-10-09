import assert from 'node:assert/strict';
import {test as nodeTest} from 'node:test';
import outdent from 'outdent';
import {lint} from './utils/lint.js';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'# Comment\na: 1',
		'#\na: 1',
		'## Section\na: 1',
		'#####\na: 1',
		'#\tTabbed\na: 1',
		'a: 1 # Trailing',
		'/* Comment */\na: 1',
		'/**/\na: 1',
		'/** Documentation */\na: 1',
		'/*****/\na: 1',
		'/*** Banner ***/\na: 1',
		'/* Note **/\na: 1',
		'##\tSection\na: 1',
		'##\na: 1',
		'/**\n * Note\n */\na: 1',
		'a: 1 ## Trailing',
		'/***\tBanner\t***/\na: 1',
		outdent`
			/*
			Region
			*/
			a: 1
		`,
		'a: \'#not a comment\'',
		outdent`
			palette: [
				#ff0000
				#FFF,
				#ff000080
			]
		`,
		// Whitespace after the color, which an editor may not remove.
		'palette: [\n\t#ff0000 \n\t#FFF,\t\n]',
		// A space before the comma, as in the layout `[1 , 2]`.
		'palette: [\n\t#ff0000 ,\n\t#FFF\n]',
		// A comment after the color.
		'palette: [\n\t#00FF00 # green\n\t#0000FF, # blue\n\t#FFF /* white */\n]',
		'#ff0000 , # red\na: 1',
		// A line comment that ends with `*` is not a block comment.
		'a: 1 # important*',
	],
	invalid: [
		'#Comment\na: 1',
		'a: 1 #Trailing',
		'#!shebang\na: 1',
		'/*Comment */\na: 1',
		'/* Comment*/\na: 1',
		'/*Comment*/\na: 1',
		'a: [1, /*x*/ 2]',
		'#eslint-disable-next-line\na: 1',
		'#fg0\na: 1',
		'#fffff\na: 1',
		// More markers need the space after them.
		'##Section\na: 1',
		'###Section\na: 1',
		'/**Note */\na: 1',
		'/* Note**/\na: 1',
		'/**Note**/\na: 1',
		'a: [1, ##x\n2]',
		'/***Banner***/\na: 1',
		'##eslint-disable-next-line\na: 1',
		// A hex color after more `#` is not a color that `#` turned into a comment.
		'##ff0000\na: 1',
		// Text after the color is not a comment, so it is not a color.
		'#ff0000 red\na: 1',
		// Neither is text after the space and the comma.
		'#ff0000 ,x\na: 1',
	],
});

nodeTest('hex colors remain exempt when their trailing comment contains Unicode separators', () => {
	for (const separator of ['\u{2028}', '\u{2029}']) {
		for (const tail of ['# before', '/* before']) {
			const code = `palette: [\n\t#ff0000 , ${tail}${separator}after\n]`;
			assert.deepEqual(lint(code, {'soml/spaced-comment': 'error'}), []);
		}
	}
});
