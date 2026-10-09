import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'name: \'soml\'',
		'\'the name\': 1',
		// Without quotes, a key with a `.` is a parse error.
		'\'a.b\': 1',
		'\'1.5\': 1',
		'\'\': 1',
		'\'café\': 1',
		'\'a:b\': 1',
		String.raw`"a\nb": 1`,
		'a: \'b\'',
		'[\'a\']',
		'"it\'s": 1',
	],
	invalid: [
		'\'name\': \'soml\'',
		'"name": \'soml\'',
		'\'404\': \'Not found\'',
		'\'-foo\': 1',
		'\'true\': 1',
		String.raw`"\u{61}": 1`,
		'a: {\'b\': 1}',
		'[{\'b\': 1}]',
		'\'a\': 1 # Comment',
		'[{\'a\': [{\'b\': 1}]}]',
		'\'a_b-c\': 1',
	],
});
