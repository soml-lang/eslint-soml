import assert from 'node:assert/strict';
import {codeFrameColumns} from '@babel/code-frame';
import outdent from 'outdent';
import * as YAML from 'yaml';
import plugin from '../../index.js';
import {
	applyFix,
	canonical,
	filename,
	linter,
} from './lint.js';

const isPlainObject = value => value && Object.getPrototypeOf(value) === Object.prototype;

function serializeOptions(value) {
	return YAML.stringify(
		value,
		(key, value) => {
			if (
				value === null
				|| typeof value === 'boolean'
				|| typeof value === 'number'
				|| typeof value === 'string'
				|| Array.isArray(value)
				|| isPlainObject(value)
			) {
				return value;
			}

			throw new Error('Unsupported value');
		},
		{
			defaultKeyType: 'PLAIN',
			defaultStringType: 'QUOTE_SINGLE',
		},
	)
		.trimEnd();
}

const codeFrameColumnsOptions = {linesAbove: Infinity, linesBelow: Infinity};

function visualizeRange(text, location, message) {
	return codeFrameColumns(
		text,
		location,
		{
			...codeFrameColumnsOptions,
			message,
		},
	);
}

function visualizeEslintMessage(text, result) {
	const {line, column, endLine, endColumn, message} = result;
	const location = {
		start: {
			line,
			column: Math.max(0, column - 1),
		},
	};

	if (typeof endLine === 'number' && typeof endColumn === 'number') {
		location.end = {
			line: endLine,
			column: Math.max(0, endColumn - 1),
		};
	}

	return visualizeRange(text, location, message);
}

const printCode = code => codeFrameColumns(code, {start: {line: 0, column: 0}}, codeFrameColumnsOptions);
const getAdditionalProperties = (object, properties) =>
	Object.keys(object).filter(property => !properties.includes(property));

function assertKnownProperties(tests) {
	for (const type of ['valid', 'invalid']) {
		for (const testCase of tests[type]) {
			const additionalProperties = getAdditionalProperties(testCase, ['code', 'options', 'only']);

			if (additionalProperties.length > 0) {
				throw new Error(`Unexpected ${type} snapshot test case properties: ${additionalProperties.join(', ')}`);
			}
		}
	}
}

export function getVerifyConfig(ruleId, rule, {options = []}) {
	// https://github.com/eslint/eslint/blob/ee7f9e62102d3dd0b7581d1e88e41bce3385980a/lib/rule-tester/rule-tester.js#L501
	const pluginName = 'rule-to-test';

	// Avoid a separate `{files}` config-array entry here. It makes ESLint merge an extra config for every snapshot test case. Keep `files` on the real config so non-JS filenames still match.
	return {
		files: ['**'],
		language: 'soml/soml',
		rules: {
			[`${pluginName}/${ruleId}`]: ['error', ...options],
		},
		plugins: {
			soml: plugin,
			[pluginName]: {
				rules: {
					[ruleId]: rule,
				},
			},
		},
		// https://github.com/eslint/eslint/blob/ee7f9e62102d3dd0b7581d1e88e41bce3385980a/lib/config/default-config.js#L46-L48
		linterOptions: {
			reportUnusedDisableDirectives: 'off',
		},
	};
}

export function verify(code, verifyConfig) {
	const messages = linter.verify(code, verifyConfig, {filename});

	// Missed `message`, #1923
	const invalidMessage = messages.find(({message}) => typeof message !== 'string');
	if (invalidMessage) {
		throw Object.assign(new Error('Unexpected message.'), {eslintMessage: invalidMessage});
	}

	// Snapshots check the rendered message text. A placeholder may be decoded data, even when its name matches a message template, so it cannot reliably identify missing data here.

	const fatalError = messages.find(({fatal}) => fatal);
	if (fatalError) {
		const {line, column, message} = fatalError;
		throw new SyntaxError('\n' + codeFrameColumns(code, {start: {line, column: Math.max(0, column - 1)}}, {message}));
	}

	return messages;
}

export default class SnapshotRuleTester {
	constructor(test) {
		this.test = test;
	}

	run(ruleId, rule, {valid, invalid}) {
		const {test} = this;
		const {fixable} = rule.meta;

		assertKnownProperties({valid, invalid});

		for (const [index, testCase] of valid.entries()) {
			const {code: input, only} = testCase;
			const verifyConfig = getVerifyConfig(ruleId, rule, testCase);

			test(
				`valid(${index + 1}): ${input}`,
				{only},
				() => {
					const messages = verify(input, verifyConfig);
					assert.deepEqual(messages, [], 'Valid case should not have errors.');
				},
			);
		}

		for (const [index, testCase] of invalid.entries()) {
			const {code: input, options, only} = testCase;
			const verifyConfig = getVerifyConfig(ruleId, rule, testCase);
			const runVerify = code => verify(code, verifyConfig);

			test(
				`invalid(${index + 1}): ${input}`,
				{only},
				t => {
					const messages = runVerify(input);

					assert.notDeepEqual(messages, [], 'Invalid case should have at least one error.');

					const inputSnapshotParts = [];
					let shouldPrintCodeHead = false;

					if (Array.isArray(options)) {
						inputSnapshotParts.push(outdent`
							Options:
							${serializeOptions(options)}
						`);
						shouldPrintCodeHead = true;
					}

					inputSnapshotParts.push(shouldPrintCodeHead
						? outdent`
							Code:
							${printCode(input)}
						`
						: printCode(input));

					t.assert.snapshot(`\n${inputSnapshotParts.join('\n\n')}\n`);

					for (const message of messages) {
						const snapshotParts = [
							outdent`
								Message:
								${visualizeEslintMessage(input, message)}
							`,
						];

						if (fixable && message.fix) {
							const output = applyFix(input, message);
							assert.notEqual(output, input, 'An autofix should change the code.');
							runVerify(output);
							assert.equal(canonical(output), canonical(input), 'An autofix must keep the value of the document.');

							snapshotParts.push(outdent`
								Output:
								${printCode(output)}
							`);
						}

						const {suggestions = []} = message;

						for (const [index, suggestion] of suggestions.entries()) {
							const output = applyFix(input, suggestion);
							assert.notEqual(output, input, 'Suggestion should provide different output.');

							runVerify(output);

							snapshotParts.push(outdent`
								Suggestion ${index + 1}/${suggestions.length}: ${suggestion.desc}:
								${printCode(output)}
							`);
						}

						t.assert.snapshot(`\n${snapshotParts.join('\n\n')}\n`);
					}

					if (!fixable) {
						return;
					}

					// Every fixable problem is gone after `--fix`, which applies the fixes over several passes.
					const {output, messages: remaining} = linter.verifyAndFix(input, verifyConfig, {filename});
					// A later pass can introduce a parse error or change the value even when the first fix was safe.
					assert.equal(canonical(output), canonical(input), 'An autofix must keep the value of the document.');
					assert.deepEqual(remaining.filter(({fix}) => fix), [], 'The autofix should converge.');
				},
			);
		}
	}
}
