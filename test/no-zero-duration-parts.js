import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'a: 5h',
		'a: 1h30m',
		'a: 0s',
		'a: 0ms',
		'a: 1m0.5s',
		'a: 1h1ms',
		'a: 10m',
		'a: 1_000ms',
		'a: \'1h0m0s\'',
		'a: -5m',
		'[30s]',
	],
	invalid: [
		'refresh: 1h0m0s',
		'grace: 0h30m',
		'a: 5m0s',
		'a: 1h0m30s',
		'a: -1h0m',
		'a: 0h0m',
		'a: 0h0m0s0ms',
		'a: 2h0ms',
		'a: 1h0.0s',
		'a: [5m0s, 30m0s]',
		'[1h0m] # Hour',
		'a: {t: -2h0m30s}',
	],
});
