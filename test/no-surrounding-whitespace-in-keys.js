import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'timeout: 30s',
		'\'timeout\': 30s',
		'"timeout": 30s',
		'\'display name\': \'Ada\'',
		String.raw`"display\tname": 1`,
		// A key of only whitespace is for `no-empty-keys`.
		'\' \': 1',
		'\'\': 1',
		String.raw`"\t": 1`,
		String.raw`"\n\u{a0}": 1`,
		// Not whitespace.
		'\'\u{FEFF}a\': 1',
		'\'a\u{200B}\': 1',
		String.raw`"a\u{200d}": 1`,
		String.raw`'a\n': 1`,
		// Values are not checked.
		'a: \' value \'',
		'a: [\' x\']',
		'a: {b: \'c \'}',
	],
	invalid: [
		'\'timeout \': 30s',
		'\' timeout\': 30s',
		'\' timeout \': 30s',
		'"timeout ": 30s',
		String.raw`"timeout\t": 30s`,
		String.raw`"\ntimeout": 30s`,
		String.raw`"timeout\u{a0}": 30s`,
		String.raw`"timeout\u{85}": 30s`,
		String.raw`"timeout\u{3000}": 30s`,
		'\'timeout\u{A0}\': 30s',
		'\'timeout\u{2028}\': 30s',
		'\'timeout\t\': 30s',
		// U+FEFF is not whitespace, so it stays in the trimmed key.
		'\' a\u{FEFF}\': 1',
		'\'database.host \': \'localhost\'',
		'\'display name \': \'Ada\'',
		'a: {\'b \': 1}',
		'[{\' c\': 1}]',
		'{\'d \': 1}',
		'\'a \': 1 # comment',
		'/* comment */ \'a \': 1',
		'\'a \': 1\n\' b\': 2',
		// The trimmed key is already there, which is why the rule has no fix.
		'\'timeout \': 2s\ntimeout: 1s',
	],
});
