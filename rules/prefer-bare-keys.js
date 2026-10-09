import {isBareKey} from 'soml-lang';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'prefer-bare-keys';
const messages = {
	[MESSAGE_ID]: 'The key `{{key}}` does not need quotes.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Key', node => {
		// A key with a `.` is not a bare key, so `'a.b'` keeps its quotes. Without them, `a.b` is a parse error.
		if (node.style === 'bare' || !isBareKey(node.value)) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			data: {key: node.value},
			fix: fixer => fixer.replaceText(node, node.value),
		};
	});
};

/**
@type {SomlRule}
*/
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer bare keys when a key does not need quotes.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
