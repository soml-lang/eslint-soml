/*
The templates of `npm run create-rule` give a rule, a test, and a doc that pass from the start.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import renderRuleTemplate from '../scripts/template/rule.js.template.js';
import {toEslintRules} from '../rules/rule/index.js';
import plugin from '../index.js';
import {
	applyFix,
	canonical,
	filename,
	linter,
} from './utils/lint.js';

const templateDirectory = new URL('../scripts/template/', import.meta.url);
const testTemplate = fs.readFileSync(new URL('test.js.template.txt', templateDirectory), 'utf8');
const documentationTemplate = fs.readFileSync(new URL('documentation.md.template.txt', templateDirectory), 'utf8');

// The cases of the test template, as JavaScript string literals.
const getCases = kind => {
	const list = new RegExp(String.raw`${kind}: \[\n(?<cases>.*?)\n\t\],`, 'sv').exec(testTemplate).groups.cases;
	return list.split('\n').map(line => JSON.parse(`"${line.trim().slice(1, -2).replaceAll(String.raw`\'`, '\'').replaceAll('"', String.raw`\"`)}"`));
};

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eslint-soml-template-'));

test.after(() => {
	fs.rmSync(directory, {recursive: true, force: true});
});

for (const fixableType of ['code', 'whitespace', false]) {
	for (const hasSuggestions of [true, false]) {
		test(`the rule template with fixable ${fixableType} and${hasSuggestions ? '' : ' no'} suggestions`, async () => {
			const id = `template-${fixableType}-${hasSuggestions}`;
			// A description with quotes and a backslash must still give a rule that parses.
			const source = renderRuleTemplate({
				id,
				description: String.raw`Disallow 'unicorn' and "\u{1F984}".`,
				fixableType,
				type: 'problem',
				hasSuggestions,
			});

			const file = path.join(directory, `${id}.js`);
			fs.writeFileSync(file, source);
			const {default: rule} = await import(pathToFileURL(file));
			assert.equal(rule.meta.docs.description, String.raw`Disallow 'unicorn' and "\u{1F984}".`);

			const config = {
				files: ['**/*.soml'],
				language: 'soml/soml',
				plugins: {
					soml: {
						languages: plugin.languages,
						rules: toEslintRules({[id]: rule}),
					},
				},
				rules: {[`soml/${id}`]: 'error'},
			};

			for (const code of getCases('valid')) {
				assert.deepEqual(linter.verify(code, config, {filename}), [], code);
			}

			for (const code of getCases('invalid')) {
				const messages = linter.verify(code, config, {filename});
				assert.equal(messages.length, 1, code);
				const [message] = messages;
				assert.equal(Boolean(message.fix), Boolean(fixableType));

				if (message.fix) {
					assert.equal(canonical(applyFix(code, message)), canonical(code), 'An autofix must keep the value of the document.');
				}

				assert.equal(message.suggestions?.length ?? 0, hasSuggestions ? 1 : 0);
			}
		});
	}
}

test('the doc template starts with a title, which `eslint-doc-generator` replaces with the header', () => {
	assert.match(documentationTemplate, /^# .+\n\n<!-- end auto-generated rule header -->/v);
});
