/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_INT = 'no-mixed-number-types/int';
const MESSAGE_ID_FLOAT = 'no-mixed-number-types/float';
const MESSAGE_ID_SUGGESTION = 'no-mixed-number-types/suggestion';
const messages = {
	// Ints are reported when there are at least as many floats, so only the float message can say "most".
	[MESSAGE_ID_INT]: '`{{number}}` is an int, but this array also has floats.',
	[MESSAGE_ID_FLOAT]: '`{{number}}` is a float, but most numbers in this array are ints.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as a float: `{{replacement}}`.',
};

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('Array', function * (node) {
		const ints = node.elements.filter(element => element.type === 'Integer');
		const floats = node.elements.filter(element => element.type === 'Float');

		if (ints.length === 0 || floats.length === 0) {
			return;
		}

		// The fewer kind is the likely mistake. An int becomes a float by adding `.0`, which only works for a decimal int, and only keeps the number when a float can hold it exactly.
		if (ints.length <= floats.length) {
			for (const int of ints) {
				const number = sourceCode.getText(int);
				const replacement = `${number}.0`;

				yield {
					node: int,
					messageId: MESSAGE_ID_INT,
					data: {number},
					suggest: int.radix === 10 && BigInt(Number(int.value)) === int.value
						? [
							{
								messageId: MESSAGE_ID_SUGGESTION,
								data: {replacement},
								fix: fixer => fixer.replaceText(int, replacement),
							},
						]
						: [],
				};
			}

			return;
		}

		for (const float of floats) {
			yield {
				node: float,
				messageId: MESSAGE_ID_FLOAT,
				data: {number: sourceCode.getText(float)},
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
			description: 'Disallow arrays that mix ints and floats.',
			recommended: true,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
