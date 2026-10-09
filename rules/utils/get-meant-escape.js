/*
A backslash and what follows it, as a `"…"` string reads them. A `\u{…}` in another spelling, such as `\u{E9}` or `\u0041`, is not a SOML escape, so it goes to `other`, and so does a backslash at the end.
*/
const BACKSLASH = /\\(?:(?<escape>[\\nt]|u\{(?:0|[1-9a-f][\da-f]{0,5})\})|(?<other>.?))/gsv;

/*
A Windows path, which starts with a drive, as in `C:\`, a network share, as in `\\server`, or a relative folder, as in `.\` and `..\`.
*/
const PATH = /^(?:[A-Za-z]:\\|\\\\|\.\.?\\)/v;
const WHITESPACE = /[\t ]/v;
const NAME_START = /[\p{Letter}\p{Number}]/v;

/**
The first escape in a value that was likely meant as one, such as `\n` in `Line one\nLine two`, or `undefined` when there is none. In a literal string, `'…'`, an escape is a backslash and the characters after it, as it is in TOML and in a shell, but in JavaScript and Python, `'…'` reads escapes.

A value is only checked when every backslash in it starts a SOML escape, so a regular expression such as `^\d+\n$`, which has `\d`, is not. A Windows path is not checked either, and neither is a value with a `"`, because it is code with strings in it, such as JSON text or a shell command with `printf "%s\n"`, which keeps its escapes for the program that runs it.

A `\u{…}` escape is always likely meant. A `\n` or `\t` is when the value has a space or a tab, as text does, or when no letter or digit follows it, as at the end of `Done.\n`. A `\n` or `\t` before a name without whitespace in the value, as in `src\test`, is more likely a path.

@param {string} value
@returns {string | undefined}
*/
export default function getMeantEscape(value) {
	if (value.includes('"') || PATH.test(value)) {
		return;
	}

	const backslashes = value.matchAll(BACKSLASH).toArray();

	if (backslashes.some(({groups}) => groups.escape === undefined)) {
		return;
	}

	const hasWhitespace = WHITESPACE.test(value);
	// Only the character after the escape is read, so a value with many escapes takes linear time.
	const isBeforeName = index => {
		const codePoint = value.codePointAt(index);
		return codePoint !== undefined && NAME_START.test(String.fromCodePoint(codePoint));
	};

	const isMeant = ({0: escape, index}) => escape.startsWith(String.raw`\u`)
		|| hasWhitespace
		|| !isBeforeName(index + escape.length);

	return backslashes.find(match => match[0] !== '\\\\' && isMeant(match))?.[0];
}
