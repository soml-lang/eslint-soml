/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-quoted-keywords/error';
const MESSAGE_ID_SUGGESTION = 'no-quoted-keywords/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: '`{{string}}` is a string, not `{{keyword}}`, so a program that expects `{{keyword}}` gets text.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as `{{keyword}}`.',
};

const KEYWORDS = new Set(['true', 'false', 'null']);

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('String', node => {
		if (node.block || !KEYWORDS.has(node.value)) {
			return;
		}

		const keyword = node.value;

		return {
			node,
			messageId: MESSAGE_ID_ERROR,
			data: {
				string: context.sourceCode.getText(node),
				keyword,
			},
			suggest: [
				{
					messageId: MESSAGE_ID_SUGGESTION,
					data: {keyword},
					fix: fixer => fixer.replaceText(node, keyword),
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
			description: 'Disallow the strings `\'true\'`, `\'false\'`, and `\'null\'`.',
			recommended: true,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
