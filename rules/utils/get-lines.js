/**
@import {SomlContext} from '../rule/soml-context.js';
@import {Node} from 'soml-lang';
*/

/**
The lines of the source text of `node`, each with the offset where it starts. In a block string, the first line holds the opening delimiter, and the last line the closing one.

@param {SomlContext} context
@param {Node} node
@returns {Array<{text: string, start: number}>}
*/
export default function getLines(context, node) {
	const {sourceCode} = context;
	const lines = [];
	let [start] = sourceCode.getRange(node);

	for (const text of sourceCode.getText(node).split('\n')) {
		lines.push({text, start});
		start += text.length + 1;
	}

	return lines;
}
