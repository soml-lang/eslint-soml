import {trimEnd} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-float-trailing-zeros/error';
const MESSAGE_ID_STRING = 'no-float-trailing-zeros/string';
const MESSAGE_ID_TRIM = 'no-float-trailing-zeros/trim';
const messages = {
	[MESSAGE_ID_ERROR]: '`{{number}}` is the float `{{trimmed}}`. If it is a version or a label, such as Python 3.10, it must be a string.',
	[MESSAGE_ID_STRING]: 'Write it as the string `{{string}}`.',
	[MESSAGE_ID_TRIM]: 'Write it as `{{trimmed}}`.',
};

/*
The fraction of a float, before any exponent. A fraction of one digit, as in `1.0`, is how a float is written, so it is not matched.
*/
const FRACTION = /\.(?<fraction>\d[\d_]*\d)(?=e|$)/v;

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Float', node => {
		const number = context.sourceCode.getText(node);
		const match = FRACTION.exec(number);
		const fraction = match?.groups.fraction;

		if (fraction === undefined || !fraction.endsWith('0')) {
			return;
		}

		// The zeros at the end go, along with any `_` between them, but one digit stays.
		const fractionStart = match.index + 1;
		const trimmedFraction = trimEnd(fraction, '0_') || '0';
		const trimmed = number.slice(0, fractionStart) + trimmedFraction + number.slice(fractionStart + fraction.length);
		const string = `'${number}'`;

		return {
			node,
			messageId: MESSAGE_ID_ERROR,
			data: {number, trimmed},
			suggest: [
				{
					messageId: MESSAGE_ID_STRING,
					data: {string},
					fix: fixer => fixer.replaceText(node, string),
				},
				{
					messageId: MESSAGE_ID_TRIM,
					data: {trimmed},
					fix: fixer => fixer.replaceText(node, trimmed),
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
			description: 'Disallow trailing zeros in the fraction of a float.',
			recommended: true,
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
