/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-negative-zero';
const messages = {
	[MESSAGE_ID]: 'Zero has no sign. `{{number}}` is the same value as `{{unsigned}}`.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Float', node => {
		const number = context.sourceCode.getText(node);

		// The tree holds `-0.0` as zero, so the sign is only in the source.
		if (node.value !== 0 || !number.startsWith('-')) {
			return;
		}

		const unsigned = number.slice(1);

		return {
			node,
			messageId: MESSAGE_ID,
			data: {number, unsigned},
			// The value of `-0.0` is zero, so removing the sign keeps it.
			fix: fixer => fixer.replaceText(node, unsigned),
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
			description: 'Disallow a sign on zero.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
