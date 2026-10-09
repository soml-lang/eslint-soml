import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'name: \'soml\'',
		String.raw`message: "Line one\nLine two"`,
		String.raw`text: "Done.\\n"`,
		// Windows paths, which are correct in a literal string.
		String.raw`dir: 'C:\new\temp'`,
		String.raw`dir: 'c:\temp\new folder'`,
		String.raw`share: '\\server\new share'`,
		String.raw`dir: '.\node_modules'`,
		String.raw`dir: '..\tools\new'`,
		// A `\n` or `\t` before a name, in a value without whitespace, is more likely a path.
		String.raw`dir: 'src\test'`,
		String.raw`dir: 'tools\nuget'`,
		String.raw`columns: 'name\tage'`,
		String.raw`dir: 'backups\t2024'`,
		// A backslash that does not start a SOML escape, as in a regular expression.
		String.raw`pattern: '^\d+\n$'`,
		String.raw`pattern: '\s+\t'`,
		String.raw`text: 'one\ntwo\q'`,
		String.raw`text: 'ends with\n\'`,
		String.raw`text: 'a\r b\n'`,
		// Other spellings of a Unicode escape, which SOML does not have.
		String.raw`text: '\u0041 x'`,
		String.raw`text: '\u{E9} x'`,
		String.raw`text: '\u{00e9} x'`,
		String.raw`text: '\u{} x'`,
		// Code with strings in it keeps its escapes for the program that runs it.
		String.raw`command: 'printf "%s\n" a'`,
		String.raw`json: '{"a": "b\nc"}'`,
		// A doubled backslash is a backslash, so `n` after it is a letter.
		String.raw`text: 'a\\n b'`,
		String.raw`text: 'a\\b'`,
		// An escape for a character that SOML cannot hold.
		String.raw`text: '\u{d} x'`,
		String.raw`text: '\u{d800} x'`,
		String.raw`text: '\u{110000} x'`,
		// Without whitespace, a `\n` before a word reads as a path.
		String.raw`text: 'Hello\nWorld'`,
		String.raw`text: 'a\n𝒜'`,
		// Keys and block strings are not checked.
		String.raw`'Line one\nLine two': 1`,
		outdent`
			script: '''
				printf 'Line one\\nLine two'
				'''
		`,
	],
	invalid: [
		String.raw`message: 'Line one\nLine two'`,
		String.raw`separator: '\t'`,
		String.raw`line-ending: '\n'`,
		String.raw`format: '%s\n'`,
		String.raw`text: 'Done.\n'`,
		String.raw`text: '\nindented text'`,
		String.raw`text: 'tab\tseparated values'`,
		String.raw`text: 'Line 1\n\nLine 3'`,
		// Not before a letter or digit.
		String.raw`text: 'x\n-y'`,
		// The first escape that is meant.
		String.raw`text: 'src\nfoo\n'`,
		// A `\u{…}` escape is always meant.
		String.raw`name: 'caf\u{e9}'`,
		String.raw`emoji: '\u{1f600}'`,
		String.raw`path: 'src\u{2f}x'`,
		String.raw`text: 'x\u{41}'`,
		String.raw`text: 'say \u{22}hi\u{22}'`,
		// The suggestion keeps a value that needs escapes in a `"…"` string.
		String.raw`text: 'a\u{0}b'`,
		String.raw`text: '\u{a0}'`,
		String.raw`text: 'it\u{27}s'`,
		String.raw`text: 'a\\b and\nc'`,
		// The suggestion is a `"…"` string when its value would read as a mistake in `'…'`.
		String.raw`text: 'Use \\n for a new line, caf\u{e9}'`,
		String.raw`text: 'caf\u{e9} ^\\\\d+$'`,
		'text: \'a\tb\\n\'',
		'text: \'a\u{A0}b\\n\'',
		// A path without a drive and with a space is reported too.
		String.raw`dir: 'My Documents\notes'`,
		// Everywhere a string can be.
		String.raw`lines: ['first\n', 'second']`,
		String.raw`a: {b: 'x y\n'}`,
		String.raw`['a b\tc']`,
		String.raw`{a: 'x\n'}`,
		String.raw`a: 'x\n' # comment`,
		String.raw`a: /* comment */ 'x\n'`,
		String.raw`'the key': 'value\n'`,
		String.raw`a: ['x\n', 'y\t', 'z\u{e9}']`,
	],
});
