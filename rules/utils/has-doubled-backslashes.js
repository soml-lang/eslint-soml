const BACKSLASH_RUN = /\\+/gv;
const DOUBLED_ESCAPE = /\\\\[.DSWbdsw]/v;
const QUOTE = /["']/v;

/**
Whether every backslash in a value is doubled, as in `^\\d+$`, the way a JSON or JavaScript string writes a regex escape. In a literal string, `\\` is two backslashes, so such a value most likely came from a `"…"` string and was meant with one.

A Windows network path, as in `\\server\share`, has a single backslash too, so it is not counted. A value that holds a quote is not counted either, because it is code with strings in it, which doubles its backslashes on purpose, as JSON text does with `"` and a JavaScript or SQL snippet in a block string can with `'`.

@param {string} value
@returns {boolean}
*/
export default function hasDoubledBackslashes(value) {
	return DOUBLED_ESCAPE.test(value)
		&& !QUOTE.test(value)
		&& value.match(BACKSLASH_RUN).every(run => run.length % 2 === 0);
}
