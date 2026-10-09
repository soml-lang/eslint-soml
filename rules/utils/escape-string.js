import {invisibleCharacters, hasInvisibleCharacter} from './invisible-characters.js';
import hasDoubledBackslashes from './has-doubled-backslashes.js';
import getMeantEscape from './get-meant-escape.js';

const NOT_LITERAL = /[\p{Control}']/v;

/**
Write a character as a `\u{…}` escape, in the one spelling SOML allows: lowercase hex digits and no leading zero.

@param {string} character
@returns {string}
*/
export function toUnicodeEscape(character) {
	return String.raw`\u{${character.codePointAt(0).toString(16)}}`;
}

/**
Write line feeds and tabs in `text` as short escapes and every other invisible character as a `\u{…}` escape, such as for a decoded value in a message, where a control character could change the terminal and a bidirectional control could reorder the text.

@param {string} text
@returns {string}
*/
export function escapeInvisibleCharacters(text) {
	return text
		.replaceAll(invisibleCharacters, character => toUnicodeEscape(character))
		.replaceAll('\n', String.raw`\n`)
		.replaceAll('\t', String.raw`\t`);
}

/**
Write `value` as a `"..."` string. `\`, `"`, LF, and tab use their short escapes, and every invisible character uses a `\u{…}` escape.

@param {string} value
@returns {string}
*/
export function toEscapedString(value) {
	const escaped = value
		.replaceAll('\\', '\\\\')
		.replaceAll('"', String.raw`\"`)
		.replaceAll('\n', String.raw`\n`)
		.replaceAll('\t', String.raw`\t`);

	return `"${escapeInvisibleCharacters(escaped)}"`;
}

/**
Whether a value should be written as a `'...'` string: it has no `'`, which would end it, and no line feed, tab, or other control character, which `'...'` cannot hold or which are invisible in it. A value with an invisible character also stays escaped, as `no-invisible-characters` asks. So does a value that reads as a mistake in `'...'`: one such as `^\\d+$`, which `no-doubled-backslashes-in-literal-strings` reports, and one such as `Done.\n`, with a backslash and `n`, which `no-escapes-in-literal-strings` reports. This is stricter than canonical form, which writes C1 controls and other invisible characters in `'...'`.

@param {string} value
@returns {boolean}
*/
export function canBeLiteral(value) {
	return !NOT_LITERAL.test(value)
		&& !hasInvisibleCharacter(value)
		&& !hasDoubledBackslashes(value)
		&& getMeantEscape(value) === undefined;
}
