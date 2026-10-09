import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

// 2^-n written exactly, which takes the digits of 5^n.
const exactPowerOfTwo = n => {
	const digits = (5n ** BigInt(n)).toString();
	return `0.${'0'.repeat(n - digits.length)}${digits}`;
};

test.snapshot({
	valid: [
		'a: 0.1',
		'a: 0.0150',
		'a: 1.5e300',
		'a: 1_000.5',
		'a: -0.000_001',
		'a: 0.30000000000000004',
		'a: 9.31322574615478515625e-10',
		'a: 9007199254740992.0',
		'a: 1.7976931348623157e308',
		'a: 5e-324',
		'a: 0.0',
		'a: 0e5',
		'a: 100.0',
		'a: infinity',
		'a: -infinity',
		// Ints are exact.
		'a: 9007199254740993',
		'a: \'9007199254740993.0\'',
		'[0.1]',
		'a: 1e23',
		// Exact, with 101 significant digits, the most that `toExponential()` can check.
		`a: ${exactPowerOfTwo(144)}`,
	],
	invalid: [
		'a: 9007199254740993.0',
		'a: -9007199254740993.0',
		'a: 9_007_199_254_740_993.0',
		'a: 123456789012345678.0',
		'a: 2.4703282292062328e-324',
		'a: 0.1000000000000000000001',
		'a: [1.0, 9007199254740993.0]',
		`a: 0.${'1'.repeat(120)}`,
		'a: {b: 0.1000000000000000000001} # c',
		// Exact, but with 102 significant digits, which is reported anyway, as the docs say.
		`a: ${exactPowerOfTwo(145)}`,
	],
});
