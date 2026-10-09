import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: 0.0',
		'a: 0',
		'a: -1.5',
		'a: -0.5',
		'a: -1e-300',
		'a: 0e5',
		'a: \'-0.0\'',
		'a: -infinity',
	],
	invalid: [
		'a: -0.0',
		'a: -0e5',
		'a: -0.000',
		'a: [1.0, -0.0]',
		'[-0.0]',
		'a: -0.0 # Zero',
		'a: {b: -0.0}',
	],
});
