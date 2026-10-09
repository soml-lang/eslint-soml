import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: 1.0',
		'a: 3.1',
		'a: 3.11',
		'a: 0.0',
		'a: 100.5',
		'a: 1e10',
		'a: 1.5e10',
		'a: infinity',
		'a: 10',
		'a: \'3.10\'',
		'a: 1.0e2',
		'a: 1h',
		'a: -infinity',
		'[1.5]',
	],
	invalid: [
		'python: [3.9, 3.10]',
		'a: 1.50',
		'a: 1.00',
		'a: -2.500',
		'a: 1.5_0',
		'a: 1.000_000',
		'a: 1.20e3',
		'a: 1.0_0e-3',
		'[2.10] # Versions',
		'a: {b: 3.10}',
		'a: 0.10',
	],
});
