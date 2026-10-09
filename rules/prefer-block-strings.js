import {
	escapeInvisibleCharacters,
	getMeantEscape,
	hasDoubledBackslashes,
	hasInvisibleCharacter,
	trimEnd,
} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'prefer-block-strings';
const messages = {
	[MESSAGE_ID]: 'A string of three lines or more is easier to read as a block string.',
};

const MINIMUM_LINES = 3;

const hasTrailingWhitespace = line => trimEnd(line, '\t ') !== line;

/**
Write the lines of a `"""` block string. Every escape that `"…"` has works in it, so the line breaks at the edges, which a block string would drop, and the whitespace at the end of a line, which an editor can remove, are written as escapes.

@param {string[]} lines
@param {number} leadingCount The number of line breaks at the start of the value.
@param {number} trailingCount The number of line breaks at the end of the value.
@returns {string[]}
*/
function getEscapedLines(lines, leadingCount, trailingCount) {
	const escapedLines = lines.map(line => {
		const text = trimEnd(line, '\t ');
		const whitespace = line.slice(text.length).replaceAll(' ', String.raw`\u{20}`).replaceAll('\t', String.raw`\t`);
		return escapeInvisibleCharacters(text.replaceAll('\\', '\\\\')) + whitespace;
	});

	escapedLines[0] = String.raw`\n`.repeat(leadingCount) + escapedLines[0];
	escapedLines[escapedLines.length - 1] += String.raw`\n`.repeat(trailingCount);

	return escapedLines;
}

/**
The block string for `value`, with its lines at `indent`, or `undefined` when there is none. A `'''` block string is used when it holds the value as it is, as `prefer-literal-strings` asks, and a `"""` block string otherwise.

@param {string} value
@param {string} indent
@returns {string | undefined}
*/
function getBlockString(value, indent) {
	const withoutTrailing = trimEnd(value, '\n');
	const text = withoutTrailing.replace(/^\n+/v, '');
	const leadingCount = withoutTrailing.length - text.length;
	const trailingCount = value.length - withoutTrailing.length;
	const lines = text.split('\n');

	if (lines.length < MINIMUM_LINES) {
		return;
	}

	// A line break at the start or end, and whitespace at the end of a line, would be lost or invisible in `'''`, which has no escapes. A `'''` in the text could end it. A doubled backslash reads as a mistake, which `no-doubled-backslashes-in-literal-strings` reports, and so does a backslash that `getMeantEscape()` reads as an escape, such as `\u{41}`.
	const isLiteral = leadingCount === 0
		&& trailingCount === 0
		&& !text.includes('\'\'\'')
		&& !hasInvisibleCharacter(text)
		&& !hasDoubledBackslashes(text)
		&& getMeantEscape(text) === undefined
		&& lines.every(line => !hasTrailingWhitespace(line));

	if (!isLiteral && text.includes('"""')) {
		return;
	}

	const delimiter = isLiteral ? '\'\'\'' : '"""';
	const contentLines = isLiteral ? lines : getEscapedLines(lines, leadingCount, trailingCount);

	// An empty line needs no indentation.
	const content = contentLines.map(line => line === '' ? '' : indent + line).join('\n');
	return `${delimiter}\n${content}\n${indent}${delimiter}`;
}

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('String', node => {
		if (node.style !== 'escaped' || node.block || !node.value.includes('\n')) {
			return;
		}

		// A value that starts its own line is already where the formatter puts a block string. One after a key or another value goes one level deeper. The `format` rule then moves the opening delimiter to the next line, as the formatter does.
		const {start} = sourceCode.getLoc(node);
		const [lineIndent] = /^[\t ]*/v.exec(sourceCode.lines[start.line - 1]);
		const indent = start.column === lineIndent.length ? lineIndent : `${lineIndent}\t`;
		const blockString = getBlockString(node.value, indent);

		if (blockString === undefined) {
			return;
		}

		return {
			node,
			messageId: MESSAGE_ID,
			fix: fixer => fixer.replaceText(node, blockString),
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
			description: 'Prefer block strings for strings of three lines or more.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
