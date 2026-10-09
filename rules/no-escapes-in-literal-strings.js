import {parse} from 'soml-lang';
import {canBeLiteral, getMeantEscape, toEscapedString} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-escapes-in-literal-strings/error';
const MESSAGE_ID_SUGGESTION = 'no-escapes-in-literal-strings/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: 'A literal string, `\'…\'`, has no escapes, so `{{escape}}` is a backslash and `{{rest}}`. Use a `"…"` string for escapes.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as `{{replacement}}`.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('String', node => {
		if (node.style !== 'literal' || node.block) {
			return;
		}

		const escape = getMeantEscape(node.value);

		if (escape === undefined) {
			return;
		}

		// Every backslash starts an escape and the value has no `"`, so the same text in `"…"` is a valid string, unless an escape names a character that SOML cannot hold, such as `\u{d}`.
		let value;
		try {
			[value] = parse(`["${node.value}"]`);
		} catch {
			return;
		}

		// A literal string only when it would not be reported again, by this rule or by `no-doubled-backslashes-in-literal-strings`, as in `prefer-literal-strings`.
		const replacement = canBeLiteral(value) ? `'${value}'` : toEscapedString(value);

		return {
			node,
			messageId: MESSAGE_ID_ERROR,
			data: {
				escape,
				rest: escape.slice(1),
			},
			suggest: [
				{
					messageId: MESSAGE_ID_SUGGESTION,
					data: {replacement},
					fix: fixer => fixer.replaceText(node, replacement),
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
			description: 'Disallow escapes in literal strings, such as `\'Line one\\nLine two\'`.',
			recommended: true,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
