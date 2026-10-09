const WHITESPACE = /\p{White_Space}/v;
const isWhitespace = character => WHITESPACE.test(character);

/**
Remove Unicode whitespace from both ends of `text`. Unlike `String#trim()`, this matches the Unicode `White_Space` property exactly: it removes U+0085 NEXT LINE, and it keeps U+FEFF, which is not whitespace.

@param {string} text
@returns {string}
*/
export default function trimWhitespace(text) {
	let start = 0;
	let end = text.length;

	while (start < end && isWhitespace(text[start])) {
		start++;
	}

	while (end > start && isWhitespace(text[end - 1])) {
		end--;
	}

	return text.slice(start, end);
}
