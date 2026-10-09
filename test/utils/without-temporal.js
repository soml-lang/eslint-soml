import assert from 'node:assert/strict';

delete globalThis.Temporal;

const {default: plugin} = await import('../../index.js');
const {parseTree} = await import('soml-lang');
const {filename, lint, linter} = await import('./lint.js');

// Reading the value of an instant or a duration needs `Temporal`, so this shows that the rules and fixes below run without it. Only the error class is checked, because the message is the library's.
for (const code of ['a: 2026-09-19T14:00:00Z', 'a: 1s']) {
	assert.throws(() => parseTree(code).body.members[0].value.value, Error);
}

const code = 'z: 2026-09-19T16:00:00.500+02:00\na: [1h0m, 0.5, 1]\n';
const {output, messages} = linter.verifyAndFix(code, plugin.configs.all, {filename});

assert.equal(output, 'a: [1h, 0.5, 1]\nz: 2026-09-19T14:00:00.500Z\n');
assert.deepEqual(messages.map(message => message.ruleId), ['soml/no-mixed-number-types']);
assert.equal(messages[0].suggestions.length, 1);

for (const code of ['a: [1s, \'2s\']', 'a: [2026-09-19T14:00:00Z, \'2026-09-19T15:00:00Z\']']) {
	const messages = lint(code, {'soml/no-quoted-values-in-arrays': 'error'});
	assert.deepEqual(messages.map(({ruleId, messageId}) => [ruleId, messageId]), [['soml/no-quoted-values-in-arrays', 'no-quoted-values-in-arrays/error']]);
	assert.equal(messages[0].suggestions.length, 1);
}

for (const invalidCode of ['a: 2026-02-29T00:00:00Z', 'a: 1.1ns', 'a: 9223372036854775808ns']) {
	const messages = linter.verify(invalidCode, plugin.configs.all, {filename});
	assert.equal(messages.length, 1);
	assert.equal(messages[0].fatal, true);
	assert.equal(messages[0].ruleId, null);
	assert.match(messages[0].message, /^Parsing error: /v);
}
