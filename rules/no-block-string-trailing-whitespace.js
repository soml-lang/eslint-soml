import {getLines, trimEnd} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-block-string-trailing-whitespace';
const messages = {
	[MESSAGE_ID]: 'Whitespace at the end of a line in a block string is part of the value, and editors often remove it.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('String', function * (node) {
		if (!node.block) {
			return;
		}

		// The first line holds the opening delimiter, and the last line the closing one.
		for (const {text, start} of getLines(context, node).slice(1, -1)) {
			const content = trimEnd(text, ' \t');

			// A blank line becomes an empty line, so its whitespace is not part of the value.
			if (content !== '' && content.length < text.length) {
				yield {
					loc: {
						start: sourceCode.getLocFromIndex(start + content.length),
						end: sourceCode.getLocFromIndex(start + text.length),
					},
					messageId: MESSAGE_ID,
				};
			}
		}
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
			description: 'Disallow trailing whitespace in block strings.',
			recommended: 'unopinionated',
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
