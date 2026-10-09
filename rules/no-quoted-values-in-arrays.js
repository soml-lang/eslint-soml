import {parseTree} from 'soml-lang';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-quoted-values-in-arrays/error';
const MESSAGE_ID_SUGGESTION = 'no-quoted-values-in-arrays/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: '`{{string}}` is a string, but this array holds {{type}}.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as `{{value}}`.',
};

/*
The types a string can spell. A boolean or `null` in quotes is for `no-quoted-keywords`. A float in quotes is not checked, because it is most often a version, as in `[1.21, 1.22, '1.23']`, where the floats are the mistake.
*/
const TYPES = new Map([
	['Integer', 'ints'],
	['Instant', 'instants'],
	['Duration', 'durations'],
]);

/**
The type of the one value that `text` is the exact spelling of, such as `'Integer'` for `443` and `'Duration'` for `2s`, or `undefined` when it is not one value.

@param {string} text
@returns {string | undefined}
*/
function getSpelledType(text) {
	let element;
	try {
		[element] = parseTree(`[${text}]`).body.elements;
	} catch {
		return;
	}

	if (element === undefined) {
		return;
	}

	// eslint-disable-next-line internal/no-restricted-property-access -- A node of another document, not of this file.
	const [start, end] = element.range;

	// The value must be all of the text, so whitespace, a comment, or a second item around it does not count.
	if (start === 1 && end === text.length + 1) {
		return element.type;
	}
}

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Array', function * (node) {
		const strings = [];
		const typed = [];

		// `null` is the missing value in a list of any type, so it does not count.
		for (const element of node.elements) {
			if (element.type === 'String') {
				strings.push(element);
			} else if (element.type !== 'Null') {
				typed.push(element);
			}
		}

		const type = typed[0]?.type;

		// Each string is reported only when the array would hold one type without quotes, so an array with other text, such as `[80, 443, 'auto', '8080']`, is not. The quoted items must also be no more than the others, or the others are more likely the mistake.
		if (
			!TYPES.has(type)
			|| strings.length === 0
			|| strings.length > typed.length
			|| typed.some(element => element.type !== type)
			|| strings.some(string => string.block || getSpelledType(string.value) !== type)
		) {
			return;
		}

		for (const string of strings) {
			const {value} = string;

			yield {
				node: string,
				messageId: MESSAGE_ID_ERROR,
				data: {
					string: context.sourceCode.getText(string),
					type: TYPES.get(type),
				},
				suggest: [
					{
						messageId: MESSAGE_ID_SUGGESTION,
						data: {value},
						fix: fixer => fixer.replaceText(string, value),
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
			description: 'Disallow quoted values in an array of that type, such as `\'443\'` in `[80, \'443\']`.',
			recommended: true,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
