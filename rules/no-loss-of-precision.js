import {stringifyValue} from 'soml-lang';
import {trimEnd} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-loss-of-precision';
const messages = {
	[MESSAGE_ID]: 'This number cannot be stored exactly as a float. Its value is `{{value}}`.',
};

/*
The significant digits and the exponent of a decimal number, without leading or trailing zeros. `0.0150` is the digits `15` and the exponent `-2`, which is 1.5e-2.
*/
function normalize(text) {
	const [mantissa, exponent = '0'] = text.replaceAll('_', '').replace(/^-/v, '').split('e', 2);
	const [integer, fraction = ''] = mantissa.split('.', 2);
	const allDigits = integer + fraction;
	const significant = allDigits.replace(/^0+/v, '');
	const leadingZeros = allDigits.length - significant.length;

	return {
		digits: trimEnd(significant, '0'),
		exponent: Number(exponent) + integer.length - 1 - leadingZeros,
	};
}

/*
Whether the stored float, written with as many significant digits as the literal has, is not the literal. This is how ESLint's own `no-loss-of-precision` rule decides.
*/
function losesPrecision(text, value) {
	const literal = normalize(text);

	// Zero is exact.
	if (literal.digits === '') {
		return false;
	}

	// `toExponential()` takes at most 100 fraction digits. A float written exactly with more digits than that, which is rare, is reported anyway.
	if (literal.digits.length > 101) {
		return true;
	}

	const stored = normalize(Math.abs(value).toExponential(literal.digits.length - 1));
	return stored.digits !== literal.digits || stored.exponent !== literal.exponent;
}

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Float', node => {
		if (!Number.isFinite(node.value)) {
			return;
		}

		const text = context.sourceCode.getText(node);

		if (!losesPrecision(text, node.value)) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			data: {
				// As canonical form writes it.
				value: stringifyValue(node.value),
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
			description: 'Disallow floats whose written digits are lost when they are stored.',
			recommended: 'unopinionated',
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
