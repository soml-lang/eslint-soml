import {getKeyWords} from './utils/index.js';

/**
@import {SomlContext} from './rule/soml-context.js';
@import {SomlRule} from './rule/to-eslint-rule.js';
*/

const MESSAGE_ID_ERROR = 'no-decimal-file-modes/error';
const MESSAGE_ID_SUGGESTION = 'no-decimal-file-modes/suggestion';
const messages = {
	[MESSAGE_ID_ERROR]: '`{{number}}` is a decimal number, so this file mode is `{{octal}}`. A file mode is octal, as in `0o{{digits}}`.',
	[MESSAGE_ID_SUGGESTION]: 'Write it as `0o{{digits}}`.',
};

/*
The last word of a key for a file mode, as in `mode`, `file-mode`, `defaultMode`, `FILE_UPLOAD_PERMISSIONS` (Django), or `'listen.mode'` (PHP-FPM). A umask is left out, because it lists the permissions to remove, so what makes a mode sensible does not apply to it.
*/
const MODE_WORDS = new Set(['chmod', 'mode', 'perm', 'perms', 'permissions']);
const OCTAL_DIGITS = /^[0-7]{3,4}$/v;

/*
Whether a number is a sensible file mode, as ansible-lint's `risky-octal` rule decides: no write or execute permission without read permission, except execute alone when the owner can execute, and the owner has at least the permissions of the group, and the group at least those of others.
*/
function isSensibleMode(mode) {
	// A mode has 12 bits, so a larger number is not one, whatever its low digits are.
	if (mode > 0o7777) {
		return false;
	}

	const user = Math.trunc(mode / 64) % 8;
	const group = Math.trunc(mode / 8) % 8;
	const other = mode % 8;
	const hasWriteWithoutRead = (digit, isUser = false) => digit !== 0 && digit < 4 && !(digit === 1 && (isUser || user % 2 === 1));

	return !hasWriteWithoutRead(user, true)
		&& !hasWriteWithoutRead(group)
		&& !hasWriteWithoutRead(other)
		&& user >= group
		&& group >= other;
}

/**
@param {SomlContext} context
*/
const create = context => {
	const {sourceCode} = context;

	context.on('Member', member => {
		const {key, value} = member;

		if (value.type !== 'Integer' || value.radix !== 10 || !MODE_WORDS.has(getKeyWords(key.value).at(-1))) {
			return;
		}

		const number = sourceCode.getText(value);
		// The spec permits `_` between digits, so the digits alone decide what the number is.
		const digits = number.replaceAll('_', '');
		const decimal = Number(value.value);

		// The digits look octal, and the value makes no sense as a mode, but the same digits read as octal do.
		if (!OCTAL_DIGITS.test(digits) || isSensibleMode(decimal) || !isSensibleMode(Number.parseInt(digits, 8))) {
			return;
		}

		return {
			node: value,
			messageId: MESSAGE_ID_ERROR,
			data: {
				number,
				octal: `0o${decimal.toString(8)}`,
				digits,
			},
			suggest: [
				{
					messageId: MESSAGE_ID_SUGGESTION,
					data: {digits},
					fix: fixer => fixer.replaceText(value, `0o${digits}`),
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
			description: 'Disallow file modes written as decimal numbers.',
			recommended: 'unopinionated',
		},
		hasSuggestions: true,
		messages,
		languages: ['soml/soml'],
	},
};

export default config;
