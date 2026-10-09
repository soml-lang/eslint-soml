/*
Every `no-restricted-syntax` selector in the readme is linted against documents it must report and documents it must not, so an example that stops working is caught. A new selector in the readme needs cases here.
*/
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {lint} from './utils/lint.js';

const readme = fs.readFileSync(path.join(import.meta.dirname, '../readme.md'), 'utf8');

// A `'…'` string in the JavaScript of the readme, with its `\\` and `\'` escapes.
const decode = string => string.slice(1, -1).replaceAll(/\\(?<character>.)/gv, '$<character>');

const selectors = new Map(readme
	.matchAll(/selector: (?<selector>'(?:[^'\\]|\\.)*'),\n\t*message: (?<message>'(?:[^'\\]|\\.)*')/gv)
	.map(({groups}) => [decode(groups.message), decode(groups.selector)]));

const cases = new Map([
	[
		'Read the password from the environment.',
		{
			invalid: ['password: \'hunter2\'', 'db: {password: \'hunter2\'}', '\'password\': 1'],
			valid: ['password-file: \'/run/secrets/db\'', 'a: \'password\'', 'Password: 1'],
		},
	],
	[
		'Allow only known origins.',
		{
			invalid: ['allowed-origins: [\'*\']', 'cors-origin: \'*\'', 'cors: {cors-origins: [\'https://example.com\', \'*\']}'],
			valid: ['allowed-origins: [\'https://example.com\']', 'origin: \'*\'', 'glob: \'*\''],
		},
	],
	[
		'Do not turn off TLS verification.',
		{
			invalid: ['verify-ssl: false', 'http: {tls-verify: false}'],
			valid: ['verify-ssl: true', 'tls-verify: \'false\'', 'check: false'],
		},
	],
	[
		'Bind to a specific address.',
		{
			invalid: ['host: \'0.0.0.0\'', 'server: {listen: \'0.0.0.0\'}'],
			valid: ['host: \'127.0.0.1\'', 'address: \'0.0.0.0\'', 'host: [\'0.0.0.0\']'],
		},
	],
	[
		'Set `debug` in the environment, not in the file.',
		{
			invalid: ['debug: true', '{debug: false}'],
			valid: ['logging: {debug: true}', '[{debug: true}]', 'a: \'debug\''],
		},
	],
	[
		'This program needs ints in the JavaScript safe integer range.',
		{
			invalid: [
				'id: 9007199254740992',
				'id: -9007199254740992',
				'id: 9_007_199_254_740_992',
				'id: 0x20000000000000',
				'id: 9223372036854775807',
				'id: -9223372036854775808',
				'ids: [1, {id: 0x7FFFFFFFFFFFFFFF}]',
			],
			valid: [
				'id: 9007199254740991',
				'id: -9007199254740991',
				'id: 0x1FFFFFFFFFFFFF',
				'id: 9007199254740992.0',
				'id: \'9007199254740993\'',
				'id: 0',
			],
		},
	],
	[
		'This program needs finite numbers.',
		{
			invalid: ['limit: infinity', 'limit: -infinity', 'limits: [0.0, infinity]'],
			valid: ['limit: 1.7976931348623157e308', 'limit: -1.7976931348623157e308', 'limit: 100', 'limit: \'infinity\'', 'infinity: 1'],
		},
	],
	[
		'This program does not support the NUL character.',
		{
			invalid: [String.raw`path: "file\u{0}.txt"`, String.raw`"a\u{0}": 1`, 'a: """\n\tx\\u{0}\n\t"""'],
			valid: ['path: \'file.txt\'', String.raw`path: 'file\u{0}.txt'`, String.raw`path: "file\\u{0}.txt"`],
		},
	],
	[
		'This program does not support the key `__proto__`.',
		{
			invalid: ['__proto__: {enabled: true}', 'a: {\'__proto__\': 1}', String.raw`"__proto\u{5f}_": 1`],
			valid: ['a: \'__proto__\'', 'proto: 1', 'constructor: 1'],
		},
	],
	[
		'This program does not support instants and durations.',
		{
			invalid: ['at: 2026-09-19T14:00:00Z', 'timeout: 30s', 'a: [1, -5m]'],
			valid: ['at: \'2026-09-19T14:00:00Z\'', 'timeout-seconds: 30', '2026-09-19T14: 1'],
		},
	],
]);

test('every selector in the readme has cases', () => {
	// A selector that the pattern above does not find would not be tested.
	assert.equal(selectors.size, readme.match(/selector:/gv).length);
	assert.deepEqual(new Set(selectors.keys()), new Set(cases.keys()));
});

for (const [message, selector] of selectors) {
	const {invalid, valid} = cases.get(message) ?? {invalid: [], valid: []};
	const rules = {'no-restricted-syntax': ['error', {selector, message}]};

	for (const [code, isValid] of [...invalid.map(code => [code, false]), ...valid.map(code => [code, true])]) {
		test(`${selector}: ${code}`, () => {
			const messages = lint(code, rules);

			assert.deepEqual(messages.filter(message => message.fatal), [], `Not valid SOML:\n${code}`);
			assert.equal(messages.length > 0, !isValid, `Should ${isValid ? 'not ' : ''}be reported:\n${code}`);
		});
	}
}
