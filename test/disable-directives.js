/*
A rule whose one fix changes the whole document or a whole object must not change the lines that a disable directive keeps as they are. ESLint applies a fix even when only the problem that carries it is reported, and then removes the directive as unused.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import outdent from 'outdent';
import {filename, getConfig, linter} from './utils/lint.js';

const fix = (code, rules) => linter.verifyAndFix(code, getConfig(rules), {filename});

test('format does not change a line that a directive keeps', () => {
	const code = outdent`
		name:   'app'
		# eslint-disable-next-line soml/format
		matrix: [1,0,
		         0,1]
		port: 80

	`;

	const {output, messages} = fix(code, {'soml/format': 'error'});

	assert.equal(output, code);
	assert.deepEqual(messages.map(({line}) => line), [1, 4, 4]);
});

test('format does not change a region that a directive keeps', () => {
	const code = 'name:   \'app\'\n/* eslint-disable soml/format */\nmatrix: [1,0,\n         0,1]\n/* eslint-enable soml/format */\nport:    80\n';
	assert.equal(fix(code, {'soml/format': 'error'}).output, code);
});

test('a directive for another rule does not stop the fix of format', () => {
	const {output} = fix('name:   \'app\'\n# eslint-disable-next-line soml/no-quoted-keywords\nenabled: \'true\'\n', {
		'soml/format': 'error',
		'soml/no-quoted-keywords': 'error',
	});

	assert.equal(output, 'name: \'app\'\n# eslint-disable-next-line soml/no-quoted-keywords\nenabled: \'true\'\n');
});

test('a directive for every rule stops the fix of format', () => {
	const code = 'name:   \'app\'\n# eslint-disable-next-line\nmatrix: [1,0]\n';
	assert.equal(fix(code, {'soml/format': 'error'}).output, code);
});

test('sort-keys does not move a member that a directive keeps', () => {
	const code = 'c: 1\nb: 2\na: /* eslint-disable-line soml/sort-keys */ 3\n';
	assert.equal(fix(code, {'soml/sort-keys': 'error'}).output, code);
});
