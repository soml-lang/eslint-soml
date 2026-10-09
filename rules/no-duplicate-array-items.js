import {stringifyValue} from 'soml-lang';
import {escapeInvisibleCharacters, hasAdjacentComment, isPunctuator} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
@import {StringNode} from 'soml-lang';
*/

const MESSAGE_ID_ERROR = 'no-duplicate-array-items/error';
const MESSAGE_ID_SUGGESTION = 'no-duplicate-array-items/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: '`{{item}}` is already in this array, on line {{line}}.',
	[MESSAGE_ID_SUGGESTION]: 'Remove this item.',
};

const isComma = token => isPunctuator(token, ',');

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	/*
	The range that removing an item takes out, so that the other items keep their layout and commas:

	- An item followed by a comma and another item: the item and its comma, up to the next item.
	- The last item with a trailing comma: from the token before it, so the item before keeps its comma.
	- Any other item, which a line break or the closing bracket follows: from the comma before it, or from the end of the token before it, so a line break still separates the items around it.
	*/
	function getRemovalRange(item) {
		const after = sourceCode.getTokenAfter(item);
		const before = sourceCode.getTokenBefore(item);

		if (!isComma(after)) {
			return [sourceCode.getRange(before)[isComma(before) ? 0 : 1], sourceCode.getRange(item)[1]];
		}

		const next = sourceCode.getTokenAfter(after);

		if (isPunctuator(next, ']')) {
			return [sourceCode.getRange(before)[1], sourceCode.getRange(after)[1]];
		}

		return [sourceCode.getRange(item)[0], sourceCode.getRange(next)[0]];
	}

	context.on('Array', function * (node) {
		/**
		@type {Map<string, StringNode>}
		*/
		const seen = new Map();

		for (const item of node.elements) {
			// Only strings, because numbers and the like repeat in data, as in `[0, 0, 1]`.
			if (item.type !== 'String') {
				continue;
			}

			const first = seen.get(item.value);

			if (first === undefined) {
				seen.set(item.value, item);
				continue;
			}

			// A comment in the removal range is always directly before the item, or directly after it or its comma.
			const hasComment = hasAdjacentComment(context, item);

			yield {
				node: item,
				messageId: MESSAGE_ID_ERROR,
				data: {
					// A block string spans lines, so it is shown as a one-line string with the same value. A bidirectional control is escaped, or it could reorder the message, whichever spelling the string uses.
					item: escapeInvisibleCharacters(item.block ? stringifyValue(item.value) : sourceCode.getText(item)),
					line: sourceCode.getLoc(first).start.line,
				},
				// Removing an item changes the value, so it is a suggestion. It is left out when it would remove a comment.
				suggest: hasComment
					? []
					: [
						{
							messageId: MESSAGE_ID_SUGGESTION,
							fix: fixer => fixer.removeRange(getRemovalRange(item)),
						},
					],
			};
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
			description: 'Disallow the same string twice in an array.',
			recommended: false,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
