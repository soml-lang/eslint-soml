import {trimWhitespace} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-empty-keys';
const messages = {
	[MESSAGE_ID]: 'Keys must not be empty or only whitespace.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Key', node => {
		if (trimWhitespace(node.value) !== '') {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
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
			description: 'Disallow empty and whitespace-only keys.',
			recommended: 'unopinionated',
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
