import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'name: \'soml\'',
		String.raw`a: "line one\nline two"`,
		String.raw`a: "tab\there"`,
		'a: "don\'t"',
		String.raw`a: "\u{0}"`,
		// Invisible characters stay escaped.
		String.raw`a: "\u{a0}"`,
		String.raw`a: "zero\u{200b}width"`,
		// A backslash that reads as an escape in a literal string, which `no-escapes-in-literal-strings` reports.
		String.raw`a: "Line one\\nLine two"`,
		String.raw`a: "Done.\\n"`,
		String.raw`a: "caf\\u{e9}"`,
		String.raw`a: "\\t"`,
		'\'a\': 1',
		'a: \'\'\'\n\tx\n\t\'\'\'',
		outdent`
			a: """
				one\\ttwo
				"""
		`,
		outdent`
			a: """
				don't
				"""
		`,
	],
	invalid: [
		'name: "soml"',
		String.raw`path: "C:\\Users"`,
		// A backslash before a name, or in a path, reads as a backslash.
		String.raw`path: "C:\\new\\temp"`,
		String.raw`path: "src\\test"`,
		String.raw`pattern: "^\\d+\\n$"`,
		String.raw`a: "Hello\\nWorld"`,
		// A value with a `"` is code, which keeps its escapes for the program that runs it.
		String.raw`command: "printf \"%s\\n\" a"`,
		String.raw`a: "say \"hi\""`,
		String.raw`a: "caf\u{e9}"`,
		'a: ""',
		'"name": 1',
		'a: {"b c": 1}',
		'[1, "two"]',
		outdent`
			a: """
				one "two"
				"""
		`,
		outdent`
			a: {
				b: """"
					"""
					"""",
			}
		`,
		outdent`
			a: """
				x
			"""
		`,
	],
});
