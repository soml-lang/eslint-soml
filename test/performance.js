/*
Inputs that took quadratic time or memory before. The time bounds are generous, so they only fail on a regression to quadratic time, which takes many seconds on these sizes.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTree} from 'soml-lang';
import SomlSourceCode from '../language/soml-source-code.js';
import {lint} from './utils/lint.js';

test('getIndexFromLoc: many locations on a long last line take linear time', () => {
	const text = `[${Array.from({length: 200_000}, (_, index) => index).join(', ')}]`;
	const ast = parseTree(text);
	const sourceCode = new SomlSourceCode({text, ast});
	const start = performance.now();
	for (const node of ast.body.elements) {
		assert.equal(sourceCode.getIndexFromLoc(sourceCode.getLoc(node).start), sourceCode.getRange(node)[0]);
	}

	const duration = performance.now() - start;
	assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
});

const time = (code, rule) => {
	const start = performance.now();
	const messages = lint(code, {[`soml/${rule}`]: 'error'});
	const duration = performance.now() - start;
	assert.deepEqual(messages.filter(message => message.fatal), [], 'The document does not parse, so the rule did not run.');
	return {messages, duration};
};

for (const [rule, code] of [
	['sort-keys', Array.from({length: 2000}, (_, index) => `k${String(2000 - index).padStart(4, '0')}: ${index}`).join('\n')],
	// A copy of the whole file in every problem would make the output, such as `--format json` or the cache file, grow with the file size times the problem count.
	['format', Array.from({length: 2000}, (_, index) => `k${index}:${index}`).join('\n')],
]) {
	test(`${rule}: only the first problem carries the fix for the whole object or document`, () => {
		const {messages, duration} = time(code, rule);
		assert.ok(messages.length > 100);
		assert.equal(messages.filter(message => message.fix).length, 1);
		assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
	});
}

// Each problem needs the line and column of its offset. On the last line of a file with no line feed at the end, `TextSourceCodeBase#getLocFromIndex()` searched the rest of the text for a line feed again for every offset.
for (const [rule, code, problemCount] of [
	['no-invisible-characters', `a: [${Array.from({length: 100_000}, () => '\'\u{200B}\'').join(', ')}]`, 100_000],
	['format', `a: [${Array.from({length: 100_000}, (_, index) => index).join(',')}]`, 100_000],
]) {
	test(`${rule}: many problems on a long last line take linear time`, () => {
		const {messages, duration} = time(code, rule);
		assert.equal(messages.length, problemCount);
		assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
	});
}

test('sort-keys: checks the disable directives once per file', () => {
	const code = Array.from({length: 3000}, (_, index) => `k${String(index).padStart(4, '0')}: {b: 1, a: 2} # eslint-disable-line soml/format`).join('\n');
	const {messages, duration} = time(code, 'sort-keys');
	// The other messages are about the directives, which are unused, because `format` is off.
	assert.equal(messages.filter(message => message.ruleId === 'soml/sort-keys').length, 3000);
	assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
});

for (const [rule, code, problemCount] of [
	// A run of spaces that does not reach the end of the line is the slow case for a regex, and it is not trailing whitespace.
	['no-block-string-trailing-whitespace', `a: '''\n\tx${' '.repeat(200_000)}y\n\t'''`, 0],
	['no-float-trailing-zeros', `a: 1.${'0'.repeat(200_000)}50`, 1],
	['no-loss-of-precision', `a: 1.${'0'.repeat(200_000)}5`, 1],
	// Every escape is followed by a name, and the value has no whitespace, so none is meant.
	['no-escapes-in-literal-strings', `a: '${String.raw`\nx`.repeat(200_000)}'`, 0],
	['no-escapes-in-literal-strings', `a: '${String.raw`\u{e9}`.repeat(200_000)}'`, 1],
	['no-escapes-in-paths', String.raw`a: "C:\new${String.raw`\temp`.repeat(200_000)}"`, 1],
	['prefer-literal-strings', `a: "${String.raw`\\nx`.repeat(200_000)}"`, 1],
	// Line breaks that do not reach the end, and spaces that do not reach the end of a line.
	['prefer-block-strings', `a: "${String.raw`\n`.repeat(200_000)}x${' '.repeat(200_000)}y${String.raw`\nz\nw`}"`, 1],
	['prefer-block-strings', `a: "x${' '.repeat(200_000)}y${String.raw`\nz\nw`}"`, 1],
	['no-surrounding-whitespace-in-keys', `'${' '.repeat(200_000)}x${' '.repeat(200_000)}': 1`, 1],
]) {
	test(`${rule}: a long run of the same characters takes linear time: ${code.slice(0, 20)}`, () => {
		const {messages, duration} = time(code, rule);
		assert.equal(messages.length, problemCount);
		assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
	});
}

test('no-quoted-values-in-arrays: a long array takes linear time', () => {
	const code = `a: [${Array.from({length: 50_000}, (_, index) => index % 2 === 0 ? index : `'${index}'`).join(', ')}]`;
	const {messages, duration} = time(code, 'no-quoted-values-in-arrays');
	assert.equal(messages.length, 25_000);
	assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
});

test('no-duplicate-array-items: a long array takes linear time', () => {
	const code = `a: [${Array.from({length: 50_000}, () => '\'same\'').join(', ')}]`;
	const {messages, duration} = time(code, 'no-duplicate-array-items');
	assert.equal(messages.length, 49_999);
	assert.ok(messages.every(message => message.suggestions?.length === 1));
	assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
});

test('no-dotted-key-collisions: a large object takes linear time', () => {
	const code = Array.from({length: 20_000}, (_, index) => `k${index}: {}\n'k${index}.x': 1`).join('\n');
	const {messages, duration} = time(code, 'no-dotted-key-collisions');
	assert.equal(messages.length, 20_000);
	assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
});

test('no-misplaced-block-string-delimiters: many quote runs take linear time', () => {
	const code = `text: """\n${'a"'.repeat(100_000)}end"""\n"""`;
	const {messages, duration} = time(code, 'no-misplaced-block-string-delimiters');
	assert.equal(messages.length, 1);
	assert.equal(messages[0].messageId, 'no-misplaced-block-string-delimiters');
	assert.ok(duration < 2000, `Took ${Math.round(duration)} ms`);
});
