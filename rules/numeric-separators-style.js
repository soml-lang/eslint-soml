/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'numeric-separators-style';
const messages = {
	[MESSAGE_ID]: 'Group the digits as `{{formatted}}`.',
};

const DECIMAL_NUMBER = /^(?<sign>-?)(?<integer>[\d_]+)(?:\.(?<fraction>[\d_]+))?(?:e(?<exponentSign>-?)(?<exponent>[\d_]+))?$/v;

/*
Groups `digits` with `_`, counting from the right, or from the left for a fraction. Fewer than `minimumDigits` digits, or no `groupLength`, means no grouping.
*/
function group(digits, {minimumDigits, groupLength, isFromLeft = false}) {
	if (groupLength === undefined || digits.length < minimumDigits) {
		return digits;
	}

	const groups = [];
	// Counting from the right, the first group is the short one.
	let size = isFromLeft ? groupLength : (digits.length % groupLength) || groupLength;

	for (let start = 0; start < digits.length; start += size, size = groupLength) {
		groups.push(digits.slice(start, start + size));
	}

	return groups.join('_');
}

const removeSeparators = digits => digits.replaceAll('_', '');

/*
The number with its digits grouped. Each part is grouped on its own: the digits before the decimal point, after it, and in the exponent.
*/
function formatNumber({sign, integer, fraction, exponentSign, exponent}, options) {
	let formatted = sign + group(removeSeparators(integer), options);

	if (fraction !== undefined) {
		formatted += `.${group(removeSeparators(fraction), {...options, groupLength: options.fractionGroupLength, isFromLeft: true})}`;
	}

	if (exponent !== undefined) {
		formatted += `e${exponentSign}${group(removeSeparators(exponent), options)}`;
	}

	return formatted;
}

/**
@param {SomlContext} context
*/
const create = context => {
	const [options] = context.options;

	context.on(['Integer', 'Float'], node => {
		const text = context.sourceCode.getText(node);
		// A hexadecimal, octal, or binary int is grouped by what its digits mean, such as bytes or bits, so it is left alone, as is `infinity`.
		const match = DECIMAL_NUMBER.exec(text);

		if (match === null || (options.onlyIfContainsSeparator && !text.includes('_'))) {
			return;
		}

		const formatted = formatNumber(match.groups, options);

		if (formatted === text) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			data: {formatted},
			fix: fixer => fixer.replaceText(node, formatted),
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
			description: 'Enforce the grouping of digits with `_` in decimal numbers.',
			recommended: true,
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				additionalProperties: false,
				properties: {
					minimumDigits: {
						type: 'integer',
						minimum: 0,
						description: 'The number of digits from which separators are required.',
					},
					groupLength: {
						type: 'integer',
						minimum: 1,
						description: 'The number of digits in each group.',
					},
					fractionGroupLength: {
						type: 'integer',
						minimum: 1,
						description: 'The number of digits in each group after the decimal point. By default, the digits after the decimal point are not grouped.',
					},
					onlyIfContainsSeparator: {
						type: 'boolean',
						description: 'Whether to only check numbers that already contain a separator.',
					},
				},
			},
		],
		defaultOptions: [
			{
				minimumDigits: 5,
				groupLength: 3,
				onlyIfContainsSeparator: false,
			},
		],
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
