import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: "one"',
		'a: \'one\'',
		String.raw`a: "one\ntwo"`,
		String.raw`a: "one\ntwo\n"`,
		String.raw`a: "\none\ntwo"`,
		String.raw`a: "\n\n"`,
		String.raw`a: "\n"`,
		String.raw`a: "\n\none\n\n"`,
		// It cannot be a block string, because it has both delimiters.
		String.raw`a: "'''\n\"\"\"\nx"`,
		// Literal strings and keys are not checked.
		String.raw`a: 'one\ntwo\nthree'`,
		String.raw`"one\ntwo\nthree": 1`,
		outdent`
			a: """
				one
				two
				three
				"""
		`,
	],
	invalid: [
		String.raw`script: "set -e\nnpm ci\nnpm test"`,
		String.raw`a: "x\ny\nz\nw\nv"`,
		String.raw`a: "x\n\ny"`,
		String.raw`a: "x\n\n\n\ny"`,
		String.raw`a: "x\n  indented\ny"`,
		String.raw`a: "a\tb\nc\nd"`,
		String.raw`a: "C:\\x\ny\nz"`,
		String.raw`a: "don't\nstop\nnow"`,
		String.raw`a: "a\n\"\"\"\nb"`,
		String.raw`a: "é\n😀\n中"`,
		String.raw`a: "a\u{a}b\u{a}c"`,
		// A `"""` block string, for what `'''` cannot hold.
		String.raw`certificate: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n"`,
		String.raw`a: "\nx\ny\nz"`,
		String.raw`a: "\n\nx\ny\nz\n\n"`,
		String.raw`a: "x  \ny\nz"`,
		String.raw`a: "x\t\ny\nz"`,
		String.raw`a: "x\n  \ny"`,
		String.raw`a: "x\n\t\ny"`,
		String.raw`a: "^\\\\d+$\ny\nz"`,
		String.raw`a: "a\u{a0}b\nc\nd"`,
		String.raw`a: "a\u{0}\nb\nc"`,
		String.raw`a: "a\n'''\nb"`,
		String.raw`a: "x\\\ny\\\nz\\"`,
		String.raw`a: "x\ny\nz  \n"`,
		String.raw`a: "\tx\n\ty\n\tz"`,
		// Longer delimiters in the text.
		String.raw`a: "x\n\"\"\"\"\ny"`,
		// A backslash that reads as an escape needs `"""`, as for `\u{41}`. A `\n` before a name is a path to `getMeantEscape()`, so it stays literal, as in `prefer-literal-strings`.
		String.raw`a: "A\\nB\nC\nD"`,
		String.raw`a: "x\\u{41}y\nC\nD"`,
		String.raw`a: "x\n''''\ny"`,
		// Everywhere a string can be.
		'a: {\n\tb: "x\\ny\\nz"\n}',
		'a: {\n  b: "x\\ny\\nz"\n}',
		String.raw`a: {b: "x\ny\nz", c: 1}`,
		'a: [\n\t"x\\ny\\nz"\n]',
		String.raw`["x\ny\nz"]`,
		String.raw`["x\ny\nz", "1\n2\n3"]`,
		// The indentation comes from the line, not from the column of the string.
		String.raw`a: [1, "x\ny\nz"]`,
		String.raw`a: "x\ny\nz" # comment`,
		String.raw`a: /* comment */ "x\ny\nz"`,
		'a:\n\t' + String.raw`"x\ny\nz"`,
		// Escaping content tabs must not re-escape literal backslash sequences.
		String.raw`a: "\n\tA\tB\\tC\nD\nE\n"`,
	],
});
