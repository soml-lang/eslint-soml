import {escapeInvisibleCharacters} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-unnormalized-keys';
const messages = {
	[MESSAGE_ID]: 'The key `{{key}}` is not in {{form}}, so it can look the same as a different key.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	const [{form}] = context.options;

	context.on('Key', node => {
		if (node.value.normalize(form) === node.value) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			data: {
				key: escapeInvisibleCharacters(node.value),
				form,
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
			description: 'Disallow keys that are not in a Unicode normalization form.',
			recommended: 'unopinionated',
		},
		schema: [
			{
				type: 'object',
				additionalProperties: false,
				properties: {
					form: {
						enum: ['NFC', 'NFD', 'NFKC', 'NFKD'],
						description: 'The Unicode normalization form keys must be in.',
					},
				},
			},
		],
		defaultOptions: [{form: 'NFC'}],
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
