/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-zero-duration-parts';
const messages = {
	[MESSAGE_ID]: '`{{duration}}` has parts that are zero. Write it as `{{replacement}}`.',
};

const NONZERO_DIGIT = /[1-9]/v;

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Duration', node => {
		const {parts} = node;
		const nonzeroParts = parts.filter(part => NONZERO_DIGIT.test(part.number));

		// A duration of one part, such as `0s`, is fine. When every part is zero, the last one stays.
		if (nonzeroParts.length === parts.length || parts.length === 1) {
			return;
		}

		const duration = context.sourceCode.getText(node);
		const keptParts = nonzeroParts.length > 0 ? nonzeroParts : [parts.at(-1)];
		const replacement = (node.negative ? '-' : '') + keptParts.map(part => part.number + part.unit).join('');

		return {
			node,
			messageId: MESSAGE_ID,
			data: {duration, replacement},
			// The zero parts add nothing, so removing them keeps the value.
			fix: fixer => fixer.replaceText(node, replacement),
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
			description: 'Disallow duration parts that are zero.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
