import {canBeLiteral, hasInvisibleCharacter} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
@import {StringNode, KeyNode} from 'soml-lang';
*/

const MESSAGE_ID = 'prefer-literal-strings';
const messages = {
	[MESSAGE_ID]: 'Prefer a literal string. A `"…"` string is only needed for escapes.',
};

/**
The literal spelling of a string or key with the same value, or `undefined` when there is none.

@param {StringNode | KeyNode} node
@param {string} text The source text of the node.
@returns {string | undefined}
*/
function getLiteral(node, text) {
	// A block string keeps its layout, so it only changes when its text already means the same without escapes. With no `'` in it, no line can close the new delimiter early.
	if (node.block) {
		if (text.includes('\\') || text.includes('\'') || hasInvisibleCharacter(text)) {
			return;
		}

		const delimiter = '\''.repeat(text.indexOf('\n'));
		return delimiter + text.slice(delimiter.length, -delimiter.length) + delimiter;
	}

	// A value such as `^\\d+$` or `Done.\n` reads as a mistake in a literal string, so `canBeLiteral()` keeps it escaped.
	if (canBeLiteral(node.value)) {
		return `'${node.value}'`;
	}
}

/**
@param {SomlContext} context
*/
const create = context => {
	context.on(['String', 'Key'], node => {
		if (node.style !== 'escaped') {
			return;
		}

		const literal = getLiteral(node, context.sourceCode.getText(node));

		if (literal === undefined) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			fix: fixer => fixer.replaceText(node, literal),
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
			description: 'Prefer literal strings, `\'…\'`, when a string does not need escapes.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
