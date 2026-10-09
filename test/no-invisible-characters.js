import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'name: \'Ada Lovelace\'',
		String.raw`name: "Ada\u{a0}Lovelace"`,
		// A tab is allowed where it indents: in a block string and a comment, and between tokens.
		'a: \'\'\'\n\tx\ty\n\t\'\'\'',
		'a: """\n\tx\ty\n\t"""',
		'# a\tb\na: 1',
		'/* a\tb */\na: 1',
		'a:\t1',
		'a: [1,\t2]',
		String.raw`a: "x\ty"`,
		String.raw`"x\ty": 1`,
		// Emoji sequences and several scripts need joiners.
		'family: \'👨\u{200D}👩\u{200D}👧\'',
		'word: \'می\u{200C}خواهم\'',
		'# A comment with an emoji 😀\na: 1',
		'a: \'😀 é\'',
		// Hangul syllables are visible.
		'a: \'한국어\'',
		// A subdivision flag is an emoji tag sequence.
		'flag: \'\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}\'',
		'flags: \'\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} \u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}\'',
	],
	invalid: [
		'name: \'Ada\u{00A0}Lovelace\'',
		'name: "Ada\u{00A0}Lovelace"',
		'name: \'C:\\\\Users\u{00A0}x "q"\'',
		'a: "x\u{200B}y\u{200B}z"',
		'a: \'x\u{202E}y\u{2066}z\'',
		'a: \'\u{2028}\'',
		'a: \'\u{FEFF}\'',
		'a: \'soft\u{00AD}hyphen\'',
		'a: \'\u{0085}\'',
		'a: "\u{3000}\\n"',
		'\'a\u{00A0}b\': 1',
		// A tab in a single-line string or a quoted key looks like spaces.
		'a: \'tab\there\'',
		'a: "tab\there"',
		'a: "a\\\\\t"',
		'a: \'\t\'',
		'a: "\t\t"',
		'a: [\'x\ty\', "x\ty"]',
		'\'a\tb\': 1',
		'"a\tb": 1',
		'a: {\'\tb\': 1}',
		// The first problem in a literal string carries the fix for all of them.
		'a: \'x\ty\u{00A0}z\tw\'',
		'a: "x\ty\u{00A0}z"',
		'a: \'x\ty\' # note',
		'a: {"b\u{00A0}c": 1}',
		'[\'\u{00A0}\']',
		outdent`
			a: '''
				x\u00A0y
				'''
		`,
		outdent`
			a: """
				x\u00A0y \\t
				"""
		`,
		'# Hidden\u{00A0}space\na: 1',
		'/* bidi \u{202E} */\na: 1',
		// Invisible math operators, which are zero-width.
		'a: "f\u{2061}(x) 2\u{2062}x a\u{2063}b 1\u{2064}½"',
		// Hangul fillers, which show as blank.
		'a: \'x\u{3164}y\u{115F}z\u{1160}w\u{FFA0}v\'',
		// Tag characters outside an emoji tag sequence hide text, as in ASCII smuggling.
		'note: \'Approve\u{E0041}\u{E0042} this\'',
		'a: \'a\u{180E}b\u{206A}c\u{206F}d\'',
		'a: "\u{E0001}x"',
		// Tags after U+1F3F4 that no U+E007F ends, or more tags than a flag has, are not a flag.
		'a: \'\u{1F3F4}\u{E0068}\u{E0069}\'',
		'a: \'\u{1F3F4}\u{E0061}\u{E0062}\u{E0063}\u{E0064}\u{E0065}\u{E0066}\u{E0067}\u{E007F}\'',
		'a: \'x\u{E007F}\'',
	],
});
