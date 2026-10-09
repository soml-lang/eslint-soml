/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_START = 'spaced-comment/start';
const MESSAGE_ID_END = 'spaced-comment/end';
const messages = {
	[MESSAGE_ID_START]: 'Add a space after `{{marker}}`.',
	[MESSAGE_ID_END]: 'Add a space before `*/`.',
};

/*
A line comment may start with more `#`, as in `## Section`. A block comment may start or end with more `*`, as in a banner. The space goes after or before those, so each pattern matches the run of them when something other than whitespace is next to it. A comment of only markers, as in `#####`, needs no space.
*/
const LINE_START = /^#*(?=[^\s#])/v;
const BLOCK_START = /^\**(?=[^\s*])/v;
const BLOCK_END = /(?<=[^\s*])\**$/v;

/*
A line comment that is only a hex color, as in `#ff0000`, is almost always a color meant as an array item, which `#` turned into a comment. Adding a space would hide that mistake, so the rule leaves it, also with a comma, whitespace, or another comment after it, as in `#ff0000,` or `#ff0000 # red`. The `s` flag lets that comment hold U+2028 or U+2029, which do not end a SOML line.
*/
const HEX_COLOR = /^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})(?:[\t ]*,)?(?:[\t ]*$|[\t ]+(?:#|\/\*).*$)/isv;

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('Document', function * () {
		for (const comment of context.sourceCode.getAllComments()) {
			const {value} = comment;
			const [start, end] = context.sourceCode.getRange(comment);

			if (value === '') {
				continue;
			}

			if (comment.type === 'Line') {
				const lineStart = LINE_START.exec(value);

				if (lineStart !== null && !HEX_COLOR.test(value)) {
					yield {
						node: comment,
						messageId: MESSAGE_ID_START,
						data: {marker: '#'},
						fix: fixer => fixer.insertTextAfterRange([start, start + 1 + lineStart[0].length], ' '),
					};
				}

				continue;
			}

			const blockStart = BLOCK_START.exec(value);

			if (blockStart !== null) {
				yield {
					node: comment,
					messageId: MESSAGE_ID_START,
					data: {marker: '/*'},
					fix: fixer => fixer.insertTextAfterRange([start, start + 2 + blockStart[0].length], ' '),
				};
			}

			const blockEnd = BLOCK_END.exec(value);

			if (blockEnd !== null) {
				yield {
					node: comment,
					messageId: MESSAGE_ID_END,
					fix: fixer => fixer.insertTextBeforeRange([start + 2 + blockEnd.index, end], ' '),
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
		type: 'layout',
		docs: {
			description: 'Require a space after `#` and `/*`, and before `*/`.',
			recommended: true,
		},
		fixable: 'whitespace',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
