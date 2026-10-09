import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'enabled: false',
		'value: null',
		'a: \'True\'',
		'a: \'yes\'',
		'a: \'false positive\'',
		'\'true\': 1',
		'a: \'\'\'\n\tfalse\n\t\'\'\'',
		'a: \'nil\'',
		'a: "True"',
	],
	invalid: [
		'enabled: \'false\'',
		'enabled: "true"',
		'owner: \'null\'',
		'flags: [\'true\', false]',
		'a: {b: \'false\'}',
		'[\'null\']',
		'a: {b: \'true\'} # On',
	],
});
