import test from 'node:test';
import assert from 'node:assert/strict';
import {parse} from 'soml-lang';
import plugin from '../index.js';
import {
	applyFix,
	canonical,
	filename,
	lint,
	linter,
} from './utils/lint.js';

test('quoted dates in a date array get a type-changing suggestion', () => {
	const code = 'dates: [1582-10-10, \'2011-12-30\']';
	const messages = lint(code, {'soml/no-quoted-values-in-arrays': 'error'});
	assert.equal(messages.length, 1);
	assert.equal(messages[0].message, '`\'2011-12-30\'` is a string, but this array holds dates.');
	assert.equal(messages[0].fix, undefined);
	assert.equal(messages[0].suggestions.length, 1);
	const suggested = applyFix(code, messages[0].suggestions[0]);
	assert.equal(suggested, 'dates: [1582-10-10, 2011-12-30]');
	assert.ok(parse(suggested).dates[1] instanceof Temporal.PlainDate);
});

test('date arrays do not infer invalid dates, instants, or ordinary text', () => {
	for (const code of [
		'dates: [2000-02-29, \'1900-02-29\']',
		'dates: [2000-02-29, \'soon\']',
		'dates: [2000-02-29, \'2000-02-29T00:00:00Z\']',
		'dates: [2000-02-29T00:00:00Z, \'2000-02-29\']',
		'dates: [2000-02-29, 2000-02-29T00:00:00Z, \'2011-12-30\']',
		'dates: [null, \'2000-02-29\']',
	]) {
		assert.deepEqual(lint(code, {'soml/no-quoted-values-in-arrays': 'error'}), []);
	}
});

test('all autofixes preserve native dates and date-looking strings', () => {
	const code = 'z:2000-02-29\na:[1582-10-10,\'2011-12-30\']# calendar\n';
	const {output, messages} = linter.verifyAndFix(code, plugin.configs.all, {filename});
	assert.equal(canonical(output), canonical(code));
	assert.equal(messages.some(message => message.fatal), false);
	assert.match(output, /1582-10-10, '2011-12-30'/v);
});
