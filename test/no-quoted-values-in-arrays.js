import outdent from 'outdent';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'ports: [80, 443]',
		'ports: [\'80\', \'443\']',
		'ports: [80]',
		'ports: [\'80\']',
		'ports: []',
		// Tuples, with strings that are not how a value of the other type is written.
		'address: [1600, \'Pennsylvania\']',
		'address: [1600, \'Pennsylvania Avenue\', \'20500\']',
		'a: [1s, \'soon\']',
		'a: [2026-01-01T00:00:00Z, \'never\']',
		'a: [1, null, \'x\']',
		// Every string must be how the type is written, also when the count allows it.
		'a: [1, 2, \'x\', \'3\']',
		// More quoted items than others, so the others are more likely the mistake.
		'ports: [\'80\', \'443\', 8080]',
		// Other types than the string spells.
		'a: [1, \'2.5\']',
		'a: [1, \'infinity\']',
		'a: [1, \'1s\']',
		'a: [1s, \'1\']',
		'a: [1, \'2026-01-01T00:00:00Z\']',
		// The items other than strings have more than one type.
		'a: [1, 2.5, \'3\']',
		'a: [1, true, \'3\']',
		// Booleans and `null` are for `no-quoted-keywords`.
		'a: [true, \'false\']',
		'a: [null, \'null\']',
		// `null` does not count, so this array has no other type.
		'a: [null, \'1\']',
		// Collections.
		'a: [{b: 1}, \'{b: 1}\']',
		'a: [[1], \'[1]\']',
		// A float in quotes is most often a version.
		'python: [3.9, \'3.10\']',
		'go: [1.21, 1.22, \'1.23\']',
		'a: [0.5, \'1.5\']',
		'a: [1.5, \'infinity\']',
		'a: [1.5, \'2\']',
		// Not exactly one value.
		'a: [1, \' 2\']',
		'a: [1, \'2 \']',
		'a: [1, \'2 # c\']',
		'a: [1, \'2 /* c */\']',
		'a: [1, \'2, 3\']',
		'a: [1, \'2]\']',
		'a: [1, \'\']',
		// Not valid SOML values.
		'a: [1, \'-0\']',
		'a: [1, \'+1\']',
		'a: [1, \'01\']',
		'a: [1, \'0xff\']',
		'a: [1, \'1_\']',
		'a: [1, \'99999999999999999999\']',
		'a: [1s, \'1d\']',
		'a: [1s, \'1H\']',
		'a: [2026-01-01T00:00:00Z, \'2026-01-01\']',
		// A block string holds text.
		outdent`
			a: [
				1
				'''
				2
				'''
			]
		`,
		// Members of an object are not checked.
		'a: 1\nb: \'2\'',
	],
	invalid: [
		'ports: [80, 443, \'8080\']',
		'ports: [\'80\', 443]',
		'ports: [80, "443"]',
		String.raw`ports: [80, "4\u{34}3"]`,
		'ports: [80, /* https */ \'443\']',
		'delays: [1s, \'2s\', 5s]',
		'a: [1h30m, \'90m\']',
		'a: [1.5s, \'2.5s\']',
		'a: [-1s, \'-2s\']',
		'times: [2026-01-01T00:00:00Z, \'2026-02-01T00:00:00Z\']',
		'times: [2026-01-01T00:00:00+01:00, \'2026-01-01T00:00:00.5Z\']',
		'a: [1, null, \'3\']',
		'a: [\'1\', null, 2, 3, \'4\']',
		'a: [0xFF, \'0x10\']',
		'a: [0o644, \'0o755\']',
		'a: [0b1, \'0b10\']',
		'a: [1_000, \'2_000\']',
		'a: [-1, \'-2\']',
		'a: {ports: [80, \'443\']}',
		'[80, \'443\']',
		'a: [[1, \'2\'], [\'a\', \'b\']]',
		// The outer array has an array, which is another type, so only the inner array is reported.
		'[1, \'2\', [3, \'4\']]',
		outdent`
			ports: [
				80 # http
				'443' # https
			]
		`,
	],
});
