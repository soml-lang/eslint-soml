/*
Every `soml` example in the rule docs is linted with its rule: a part that starts with a `# ❌` comment must be reported, and a part that starts with `# ✅` must not be. Each part is linted on its own, because the two often hold the same key.
*/
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {lint} from './utils/lint.js';

const documentationDirectory = path.join(import.meta.dirname, '../docs/rules');

const getBlocks = markdown => markdown.matchAll(/^```soml\n(?<block>.*?)^```$/gmsv).map(match => match.groups.block);

function * getExamples(markdown) {
	for (const block of getBlocks(markdown)) {
		let current;

		for (const line of block.split('\n')) {
			const marker = /^# (?<marker>[✅❌])/v.exec(line)?.groups.marker;

			if (marker) {
				if (current) {
					yield current;
				}

				current = {isValid: marker === '✅', lines: []};
			}

			current?.lines.push(line);
		}

		if (current) {
			yield current;
		}
	}
}

for (const file of fs.readdirSync(documentationDirectory)) {
	const ruleId = path.basename(file, '.md');
	const markdown = fs.readFileSync(path.join(documentationDirectory, file), 'utf8');

	for (const [index, {isValid, lines}] of [...getExamples(markdown)].entries()) {
		const code = lines.join('\n');

		test(`${ruleId} example ${index + 1}`, () => {
			const messages = lint(code, {[`soml/${ruleId}`]: 'error'});

			assert.deepEqual(messages.filter(message => message.fatal), [], `Example ${index + 1} is not valid SOML:\n${code}`);
			assert.equal(messages.length > 0, !isValid, `Example ${index + 1} should ${isValid ? 'not ' : ''}be reported:\n${code}`);
		});
	}
}

test('every example block starts with a marker', () => {
	for (const file of fs.readdirSync(documentationDirectory)) {
		const markdown = fs.readFileSync(path.join(documentationDirectory, file), 'utf8');

		for (const block of getBlocks(markdown)) {
			// Lines before the first marker would not be linted.
			assert.match(block, /^# [✅❌]/v, `${file} has an example block that does not start with \`# ❌\` or \`# ✅\`:\n${block}`);
		}
	}
});

test('every rule doc has examples', () => {
	for (const file of fs.readdirSync(documentationDirectory)) {
		const markdown = fs.readFileSync(path.join(documentationDirectory, file), 'utf8');
		assert.ok(getExamples(markdown).some(({isValid}) => !isValid), `${file} has no ❌ example`);
	}
});
