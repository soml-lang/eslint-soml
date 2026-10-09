import {getLines, trimEnd} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID = 'no-block-string-edge-blank-lines';
const messages = {
	[MESSAGE_ID]: 'Blank lines at the {{edge}} of a block string are not part of the value. To {{edge}} the value with a line break, write `\\n` in a `"""` block string.',
};

const isBlank = line => trimEnd(line, ' \t') === '';

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('String', function * (node) {
		if (!node.block) {
			return;
		}

		const lines = getLines(context, node);
		// The first line holds the opening delimiter, and the last line the closing one.
		const content = lines.slice(1, -1).map(line => line.text);
		// Where each content line starts, and then where the closing line starts.
		const lineStarts = lines.slice(1).map(line => line.start);

		const firstContent = content.findIndex(line => !isBlank(line));
		// With no content, every line is a leading blank line.
		const startOfContent = firstContent === -1 ? content.length : firstContent;
		const endOfContent = Math.max(content.findLastIndex(line => !isBlank(line)) + 1, startOfContent);

		// Each range covers whole lines, with their line breaks.
		const edges = [
			['start', [lineStarts[0], lineStarts[startOfContent]]],
			['end', [lineStarts[endOfContent], lineStarts.at(-1)]],
		];

		for (const [edge, range] of edges) {
			if (range[0] === range[1]) {
				continue;
			}

			yield {
				loc: {
					start: sourceCode.getLocFromIndex(range[0]),
					// Not the line break after the last blank line.
					end: sourceCode.getLocFromIndex(range[1] - 1),
				},
				messageId: MESSAGE_ID,
				data: {edge},
				fix: fixer => fixer.removeRange(range),
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
		type: 'suggestion',
		docs: {
			description: 'Disallow blank lines at the start and end of block strings.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
