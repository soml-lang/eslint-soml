import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: 1',
		'\' a \': 1',
		'a: \'\'',
		'[\'\']',
		// U+FEFF is not whitespace. `no-invisible-characters` reports it.
		String.raw`"\u{feff}": 1`,
		'a: [\'\', \' \']',
	],
	invalid: [
		'\'\': 1',
		'"": 1',
		'a: {\'\': 1}',
		'[{"": 1}]',
		'\' \': 1',
		String.raw`"\t": 1`,
		String.raw`"\n": 1`,
		'\'\u{3000}\': 1',
		String.raw`"\u{85}": 1`,
		'\'\': 1 # Empty',
		'[[{\'\': 1}]]',
	],
});
