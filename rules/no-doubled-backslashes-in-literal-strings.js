import {hasDoubledBackslashes} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-doubled-backslashes-in-literal-strings/error';
const MESSAGE_ID_SUGGESTION = 'no-doubled-backslashes-in-literal-strings/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: 'A literal string has no escapes, so `\\\\` is two backslashes. Write one backslash.',
	[MESSAGE_ID_SUGGESTION]: 'Write one backslash for each `\\\\`.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('String', node => {
		if (node.style !== 'literal' || !hasDoubledBackslashes(node.value)) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID_ERROR,
			suggest: [
				{
					messageId: MESSAGE_ID_SUGGESTION,
					// Every backslash is doubled, so this halves each run, and the rest of the text stays as it is.
					fix: fixer => fixer.replaceText(node, context.sourceCode.getText(node).replaceAll('\\\\', '\\')),
				},
			],
		};
	});
};

/**
@type {SomlRule}
*/
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow doubled backslashes in literal strings, such as `\'^\\\\d+$\'`.',
			recommended: true,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
