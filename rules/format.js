import {formatEdits} from 'soml-lang';
import {isDisabledAnywhere} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_INSERT = 'format/insert';
const MESSAGE_ID_DELETE = 'format/delete';
const MESSAGE_ID_REPLACE = 'format/replace';
const messages = {
	[MESSAGE_ID_INSERT]: 'Insert `{{inserted}}`.',
	[MESSAGE_ID_DELETE]: 'Delete `{{deleted}}`.',
	[MESSAGE_ID_REPLACE]: 'Replace `{{deleted}}` with `{{inserted}}`.',
};

/*
Shows whitespace in a message, the way eslint-plugin-prettier does.
*/
const showInvisibles = text => text
	.replaceAll(' ', '·')
	.replaceAll('\n', '⏎')
	.replaceAll('\t', '↹');

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('Document', function * () {
		const {text} = sourceCode;
		const edits = formatEdits(text);

		if (edits.length === 0) {
			return;
		}

		const isFixable = !isDisabledAnywhere(context);

		// eslint-disable-next-line internal/no-restricted-property-access -- An edit is not a node.
		for (const [index, {range, text: inserted}] of edits.entries()) {
			const [start, end] = range;
			const deleted = text.slice(start, end);
			let messageId = MESSAGE_ID_REPLACE;

			if (deleted === '') {
				messageId = MESSAGE_ID_INSERT;
			} else if (inserted === '') {
				messageId = MESSAGE_ID_DELETE;
			}

			yield {
				loc: {
					start: sourceCode.getLocFromIndex(start),
					end: sourceCode.getLocFromIndex(end),
				},
				messageId,
				data: {
					deleted: showInvisibles(deleted),
					inserted: showInvisibles(inserted),
				},
				// Every edit is in one fix, so the formatting is applied at once. Applying only some edits, when a fix from another rule overlaps one of them, could leave a block string half moved. Only the first problem carries the fix, because a copy of every edit in every problem would make the output grow with the file size times the problem count. There is no fix when a directive turns the rule off anywhere, because the fix would change those lines too.
				fix: index === 0 && isFixable
					? function * (fixer) {
						// eslint-disable-next-line internal/no-restricted-property-access -- An edit is not a node.
						for (const {range, text} of edits) {
							yield fixer.replaceTextRange(range, text);
						}
					}
					: undefined,
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
		type: 'layout',
		docs: {
			description: 'Enforce the layout of the SOML formatter.',
			recommended: true,
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
