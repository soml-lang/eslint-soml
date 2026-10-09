import {parse} from 'soml-lang';
import {canBeLiteral, toEscapedString} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-escapes-in-paths/error';
const MESSAGE_ID_SUGGESTION = 'no-escapes-in-paths/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: 'In a `"…"` string, `{{escape}}` is {{meaning}}, not a backslash and `{{letter}}`, so this path is broken.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as `{{replacement}}`.',
};

/*
A Windows drive, such as `C:\`, at the start of the string, where a path value starts. A drive later in the string is not checked, because text such as `"Step A:\nDo it"` looks the same.
*/
const DRIVE = /^[A-Z]:\\/v;
const ESCAPE = /\\(?:u\{(?<codePoint>[\da-f]+)\}|(?<character>.))/gv;
// Only these short escapes can be mistaken for path separators; other escapes keep their meaning.
const MEANINGS = {n: 'a line break', t: 'a tab'};

/**
@param {SomlContext} context
*/
const create = context => {
	context.on('String', node => {
		if (node.style !== 'escaped' || node.block) {
			return;
		}

		const content = context.sourceCode.getText(node).slice(1, -1);

		if (!DRIVE.test(content)) {
			return;
		}

		// In a path, a backslash is followed by the name of a folder or a file, as in `\new` or `\temp`. A `\n` or `\t` before anything else, such as another escape or the end, is more likely meant.
		const isBeforeName = ({0: escape, index}) => /^[\p{Letter}\p{Number}]/v.test(content.slice(index + escape.length));
		const shortEscapes = content.matchAll(ESCAPE).filter(match => Object.hasOwn(MEANINGS, match.groups.character)).toArray();
		const mistake = shortEscapes.find(match => isBeforeName(match));

		if (mistake === undefined) {
			return;
		}

		// What the author meant: make `\n` and `\t` literal, and let the parser decode every other escape. This cannot throw, because the string already parsed, so every escape in it is valid, and `\\n` and `\\t` are valid too.
		const corrected = content.replaceAll(ESCAPE, (escape, codePoint, character) => Object.hasOwn(MEANINGS, character) ? `\\${escape}` : escape);
		const [value] = parse(`["${corrected}"]`);
		const replacement = canBeLiteral(value) ? `'${value}'` : toEscapedString(value);
		const {character} = mistake.groups;
		const suggestions = [];

		// The suggestion reads every `\n` and `\t` as a backslash and a letter, so there is none when one of them is likely meant. A path that also holds a real tab or line feed would need `\t` or `\n` again, which reads as the same mistake, so there is no suggestion then either.
		if (shortEscapes.every(match => isBeforeName(match)) && !/[\t\n]/v.test(value)) {
			suggestions.push({
				messageId: MESSAGE_ID_SUGGESTION,
				data: {replacement},
				fix: fixer => fixer.replaceText(node, replacement),
			});
		}

		return {
			node,
			messageId: MESSAGE_ID_ERROR,
			data: {
				escape: mistake[0],
				meaning: MEANINGS[character],
				letter: character,
			},
			suggest: suggestions,
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
			description: 'Disallow `\\n` and `\\t` escapes in Windows paths.',
			recommended: 'unopinionated',
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
