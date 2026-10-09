import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		outdent`
			text: '''
				foo
				bar
				'''
		`,
		// A blank line becomes an empty line, so its whitespace does not matter.
		'text: \'\'\'\n\tfoo\n\t  \n\tbar\n\t\'\'\'',
		'text: """\n\tfoo\\u{20}\n\t"""',
		'text: \'foo  \'',
		String.raw`text: "foo\t"`,
		// Trailing whitespace after the closing delimiter is outside the string.
		'text: \'\'\'\n\tfoo\n\t\'\'\' ',
		'[\'\'\'\n\tfoo\n\t\'\'\']',
	],
	invalid: [
		'text: \'\'\'\n\tfoo  \n\t\'\'\'',
		'text: """\n\tfoo\t\n\tbar \n\t"""',
		'text: \'\'\'\'\n\t\'\'\' \n\t\'\'\'\'',
		'a: {\n\tb: \'\'\'\n\t\tfoo \n\t\t\'\'\',\n}',
		'[\n\t\'\'\'\n\tfoo \n\t\'\'\'\n]',
		'a: {\n\tb: """\n\t\tfoo\t \n\t\t"""\n}',
		'a: \'\'\'\n\t😀 \n\t\'\'\'',
	],
});
