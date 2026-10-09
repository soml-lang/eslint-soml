import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: 1_000_000',
		'a: 8080',
		'a: 0.0000001',
		'a: -12_345',
		'a: 1.5e300',
		'a: 0',
		'a: infinity',
		'a: 0xFF8800',
		'a: 0xFFFF_FFFF',
		'a: 0b1010_1100',
		'a: 0o644',
		'a: 90000ms',
		'a: \'1000000\'',
		'1000000: 1',
		{
			code: 'a: 1000000',
			options: [{onlyIfContainsSeparator: true}],
		},
		{
			code: 'a: 1_0000',
			options: [{minimumDigits: 0, groupLength: 4}],
		},
		'a: 10_000.123456',
		'a: -infinity',
		'[1_000_000]',
	],
	invalid: [
		'a: 1000000',
		'a: -1000000',
		'a: 1_0000_00',
		'a: 1_000',
		'a: 1234567.5',
		'a: 0.000_00_1',
		'a: 1.5e1_0',
		'a: 100000e10',
		'a: 10000.5',
		'a: [10000, 2_0]',
		{
			code: 'a: 1_0000_00',
			options: [{onlyIfContainsSeparator: true}],
		},
		{
			code: 'a: 0.1234567',
			options: [{fractionGroupLength: 3}],
		},
		{
			code: 'a: 10000',
			options: [{minimumDigits: 0, groupLength: 2}],
		},
		'[1000000] # Big',
		'a: {b: 12345}',
		'a: 1_2_3_4_5',
		'a: -0.000_1',
		'a: 9223372036854775807',
		'a: -9223372036854775808',
	],
});
