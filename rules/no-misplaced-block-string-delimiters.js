import {getLines} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-misplaced-block-string-delimiters';
const messages = {
	[MESSAGE_ID]: 'This `{{delimiter}}` is content, because a block string only ends at a line that starts with its closing delimiter. Put the closing delimiter on its own line.',
};

const QUOTE_RUNS = {'\'': /'+/gv, '"': /"+/gv};

/*
The runs of the delimiter's quote character on the line, each with its index, its length, and where it ends. In a `"""` block, `\"` is an escaped quote, so it is not part of the run.
*/
function getQuoteRuns(line, quote, isEscaped) {
	return line.matchAll(QUOTE_RUNS[quote]).map(match => {
		let backslashCount = 0;
		if (isEscaped) {
			for (let index = match.index - 1; line[index] === '\\'; index--) {
				backslashCount++;
			}
		}

		// An odd number of backslashes immediately before a quote means it is escaped.
		const isFirstQuoteEscaped = backslashCount % 2 === 1;

		return {
			index: match.index + (isFirstQuoteEscaped ? 1 : 0),
			length: match[0].length - (isFirstQuoteEscaped ? 1 : 0),
			end: match.index + match[0].length,
		};
	}).toArray();
}

/*
Whether the run at `runIndex` closes a quote that the line opened, as in `Say '''hi'''`, because an odd number of runs of the same length come before it.
*/
function isClosingQuote(runs, runIndex, delimiterLength) {
	return runs.slice(0, runIndex).filter(run => run.length === delimiterLength).length % 2 === 1;
}

/*
What may follow a closing delimiter on its line: whitespace, commas, closing brackets, and a comment. It is sticky, so it matches from `lastIndex`, which is set before every use. The `s` flag lets the comment hold U+2028 or U+2029, which do not end a SOML line.
*/
const AFTER_DELIMITER = /[\t ]*(?:[,\]\}][\t ]*)*(?:(?:#|\/\*).*)?$/svy;

/*
Where a misplaced delimiter starts on a content line, or `undefined`: a run of exactly the delimiter's length with only what may follow a closing delimiter after it, as TOML and Java allow, in `Welcome!'''`, `Hi'''}`, or `Welcome!''' # greeting`. Only the first run with such a tail is checked, because what follows it is a comment or brackets.
*/
function getMisplacedDelimiterIndex(line, delimiter, isEscaped) {
	const runs = getQuoteRuns(line, delimiter[0], isEscaped);

	for (const [runIndex, {index, length, end}] of runs.entries()) {
		AFTER_DELIMITER.lastIndex = end;

		if (!AFTER_DELIMITER.test(line)) {
			continue;
		}

		return index > 0 && length === delimiter.length && !isClosingQuote(runs, runIndex, delimiter.length) ? index : undefined;
	}
}

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('String', node => {
		if (!node.block) {
			return;
		}

		const lines = getLines(context, node);
		// The first line is the opening delimiter, so it is a run of one quote character.
		const delimiter = lines[0].text;

		// The last line holds the closing delimiter. Only the first misplaced delimiter is reported, because the lines after it, such as the opening of another block string, are content only because of it.
		for (const {text, start} of lines.slice(1, -1)) {
			const index = getMisplacedDelimiterIndex(text, delimiter, node.style === 'escaped');

			if (index !== undefined) {
				return {
					loc: {
						start: sourceCode.getLocFromIndex(start + index),
						end: sourceCode.getLocFromIndex(start + index + delimiter.length),
					},
					messageId: MESSAGE_ID,
					data: {delimiter},
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
			description: 'Disallow a block string delimiter at the end of a content line.',
			recommended: 'unopinionated',
		},
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
