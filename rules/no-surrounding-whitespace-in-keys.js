import {escapeInvisibleCharacters, trimWhitespace} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-surrounding-whitespace-in-keys';
const messages = {
	[MESSAGE_ID]: 'The whitespace at the start or end of `{{key}}` is part of the key, so a program that reads `{{trimmed}}` does not find it.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Key', node => {
		const trimmed = trimWhitespace(node.value);

		// A key of only whitespace is for `no-empty-keys`.
		if (trimmed === '' || trimmed === node.value) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			data: {
				// The source text shows the quotes, so the whitespace is visible, and an invisible character is escaped.
				key: escapeInvisibleCharacters(context.sourceCode.getText(node)),
				trimmed: escapeInvisibleCharacters(trimmed),
			},
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
			description: 'Disallow whitespace at the start and end of keys.',
			recommended: true,
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
