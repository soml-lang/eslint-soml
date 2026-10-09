import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

const composed = 'é';
const decomposed = 'é';

test.snapshot({
	valid: [
		`'${composed}': 1`,
		`a: '${decomposed}'`,
		{
			code: `'${decomposed}': 1`,
			options: [{form: 'NFD'}],
		},
		String.raw`"caf\u{e9}": 1`,
	],
	invalid: [
		`'${decomposed}': 1`,
		String.raw`"cafe\u{301}": 1`,
		`a: {'${decomposed}': 1}`,
		{
			code: `'${composed}': 1`,
			options: [{form: 'NFD'}],
		},
		{
			code: '\'\u{FB01}\': 1',
			options: [{form: 'NFKC'}],
		},
		// An escaped control or bidirectional character stays escaped in the message.
		String.raw`"e\u{301}\u{1b}[2J\u{202e}x": 1`,
	],
});
