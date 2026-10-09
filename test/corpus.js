/*
Runs every rule at once on every valid document of the `soml-lang` conformance suite, where problems between rules show up that their own tests cannot catch. Run `npm run sync-conformance` to update the documents.
*/
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {parse} from 'soml-lang';
import plugin from '../index.js';
import {
	applyFix,
	canonical,
	filename,
	linter,
} from './utils/lint.js';

const root = path.join(import.meta.dirname, 'fixtures/conformance');

const files = fs.readdirSync(root, {recursive: true})
	.filter(file => file.endsWith('.soml'))
	.toSorted((first, second) => first.localeCompare(second, 'en'));

test('the corpus is there', () => {
	assert.ok(files.length > 300);
});

for (const file of files) {
	test(file, () => {
		const code = fs.readFileSync(path.join(root, file), 'utf8');
		const messages = linter.verify(code, plugin.configs.all, {filename});

		assert.deepEqual(messages.filter(message => message.fatal || message.ruleId === null), [], 'A rule crashed or the document did not parse.');

		for (const {suggestions = []} of messages) {
			for (const suggestion of suggestions) {
				// Throws when the suggestion is not valid SOML.
				parse(applyFix(code, suggestion));
			}
		}

		const {output, messages: remaining} = linter.verifyAndFix(code, plugin.configs.all, {filename});
		assert.equal(canonical(output), canonical(code), 'Fixing changed the value of the document.');
		assert.deepEqual(remaining.filter(message => message.fix), [], 'Fixing did not converge.');
	});
}
