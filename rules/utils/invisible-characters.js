/**
Characters that a reader cannot see, or cannot tell apart from a space: bidirectional controls (as in Trojan Source), zero-width characters (including the invisible math operators U+2061 to U+2064), the Hangul fillers, which show as blank, other invisible format characters (U+180E and U+206A to U+206F), the byte order mark, the soft hyphen, control characters, and every Unicode whitespace character except space, tab, and line feed. Zero-width joiners and non-joiners are left out, because emoji sequences and several scripts need them.

Tag characters are invisible too, and can hide text, as in ASCII smuggling. They are left out only in an emoji tag sequence, which is U+1F3F4, at most six tags, and U+E007F, as in the flag of Scotland. So a tag is reported when more than five tags or no U+1F3F4 come before it, or more than five tags or no U+E007F come after it.
*/
const characters = /[[\p{Control}\p{White_Space}\u{AD}\u{61C}\u{115F}\u{1160}\u{180E}\u{200B}\u{200E}\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2064}\u{2066}-\u{206F}\u{3164}\u{FEFF}\u{FFA0}]--[\t\n ]]/v;
const tagSpec = String.raw`[\u{E0020}-\u{E007E}]`;
const tags = new RegExp(String.raw`\u{E0001}|(?<!\u{1F3F4}${tagSpec}{0,5})${tagSpec}|${tagSpec}(?!${tagSpec}{0,5}\u{E007F})|(?<!\u{1F3F4}${tagSpec}{1,6})\u{E007F}`, 'v');
const invisibleCharacter = new RegExp(`${characters.source}|${tags.source}`, 'v');

/**
The same characters, with the `g` flag. Use it only with `String#matchAll()` and `String#replaceAll()`, which start from the beginning when `lastIndex` is 0 and leave it at 0, so the shared regex holds no state between uses.
*/
export const invisibleCharacters = new RegExp(invisibleCharacter, 'gv');

/**
Whether `text` has an invisible character.

@param {string} text
@returns {boolean}
*/
export function hasInvisibleCharacter(text) {
	return invisibleCharacter.test(text);
}
