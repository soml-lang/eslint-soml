/**
Remove the characters in `characters` from the end of `text`.

A loop rather than a regular expression such as `/[\t ]+$/`, which takes quadratic time on a long run of those characters that does not reach the end.

@param {string} text
@param {string} characters The characters to remove, such as `' \t'`.
@returns {string}
*/
export default function trimEnd(text, characters) {
	let end = text.length;

	while (end > 0 && characters.includes(text[end - 1])) {
		end--;
	}

	return text.slice(0, end);
}
