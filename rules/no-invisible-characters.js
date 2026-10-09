import {
	invisibleCharacters,
	isComment,
	toUnicodeEscape,
	toEscapedString,
} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
@import {StringNode, KeyNode, Comment} from 'soml-lang';
*/

const MESSAGE_ID_ESCAPE = 'no-invisible-characters/escape';
const MESSAGE_ID_REMOVE = 'no-invisible-characters/remove';
const MESSAGE_ID_COMMENT = 'no-invisible-characters/comment';
const messages = {
	[MESSAGE_ID_ESCAPE]: 'The character U+{{codePoint}} is invisible or looks like a space. Write it as an escape, `{{escape}}`.',
	[MESSAGE_ID_REMOVE]: 'The character U+{{codePoint}} is invisible or looks like a space. Remove it, or move the text to a `"…"` string and write it as `{{escape}}`.',
	[MESSAGE_ID_COMMENT]: 'The character U+{{codePoint}} is invisible or looks like a space. Remove it.',
};

/*
In a single-line string or a quoted key, a tab also looks like spaces. In a block string and a comment, a tab is allowed, because it indents.
*/
const singleLineCharacters = new RegExp(String.raw`${invisibleCharacters.source}|\t`, 'gv');

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	/**
	One problem per invisible character in `node`.

	@param {StringNode | KeyNode | Comment} node
	*/
	function * getProblems(node) {
		const [nodeStart] = sourceCode.getRange(node);
		const isEscaped = node.style === 'escaped';
		const isLiteral = node.style === 'literal' && !node.block;
		let messageId = MESSAGE_ID_REMOVE;

		if (isEscaped || isLiteral) {
			messageId = MESSAGE_ID_ESCAPE;
		} else if (isComment(node)) {
			messageId = MESSAGE_ID_COMMENT;
		}

		const characters = isComment(node) || node.block ? invisibleCharacters : singleLineCharacters;
		let isFirst = true;

		for (const match of sourceCode.getText(node).matchAll(characters)) {
			const [character] = match;
			const start = nodeStart + match.index;
			const end = start + character.length;
			const escape = character === '\t' ? String.raw`\t` : toUnicodeEscape(character);
			let fix;

			if (isEscaped) {
				// In `"..."`, the character is replaced by its escape where it is.
				fix = fixer => fixer.replaceTextRange([start, end], escape);
			} else if (isLiteral && isFirst) {
				// A `'...'` string has no escapes, so it becomes a `"..."` string, which escapes every invisible character at once. So only the first problem needs the fix.
				fix = fixer => fixer.replaceText(node, toEscapedString(node.value));
			}

			isFirst = false;

			// A `'''` block would need its content re-escaped line by line, and a comment cannot hold an escape, so those are only reported.
			yield {
				loc: {
					start: sourceCode.getLocFromIndex(start),
					end: sourceCode.getLocFromIndex(end),
				},
				messageId,
				data: {
					codePoint: character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
					escape,
				},
				fix,
			};
		}
	}

	context.on(['String', 'Key'], node => {
		if (node.style !== 'bare') {
			return getProblems(node);
		}
	});

	context.on('Document', function * () {
		for (const comment of sourceCode.getAllComments()) {
			yield * getProblems(comment);
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
			description: 'Disallow invisible characters in strings, keys, and comments.',
			recommended: 'unopinionated',
		},
		fixable: 'code',
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
