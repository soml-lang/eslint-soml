import {parseTree, ParseError, visitorKeys} from 'soml-lang';
import SomlSourceCode from './soml-source-code.js';

/**
@import {File, OkParseResult, ParseResult} from '@eslint/core';
@import {DocumentNode} from 'soml-lang';
*/

/*
A 1-based line and column, with the column in UTF-16 code units like every other ESLint column. ESLint does not adjust a parse error's position by `columnStart`. `ParseError#column` counts code points instead, so it is not used.
*/
function locate(text, offset) {
	const before = text.slice(0, offset);
	return {line: before.split('\n').length, column: offset - before.lastIndexOf('\n')};
}

/**
The SOML language for ESLint.
*/
export default class SomlLanguage {
	fileType = 'text';
	lineStart = 1;
	columnStart = 0;
	nodeTypeKey = 'type';
	visitorKeys = visitorKeys;

	/**
	There are no language options.
	*/
	validateLanguageOptions() {}

	/**
	@param {File} file
	@returns {ParseResult<DocumentNode>}
	*/
	parse(file) {
		// ESLint removes a BOM before this point, so it is checked here.
		if (file.bom) {
			return {
				ok: false,
				errors: [{message: 'A byte order mark (BOM) is not allowed', line: 1, column: 1}],
			};
		}

		const text = /** @type {string} */ (file.body);

		try {
			return {ok: true, ast: parseTree(text)};
		} catch (error) {
			if (!(error instanceof ParseError)) {
				throw error;
			}

			// `reason` is the message without the position and the code frame, which ESLint shows on its own.
			return {
				ok: false,
				errors: [{message: error.reason, ...locate(text, error.offset)}],
			};
		}
	}

	/**
	@param {File} file
	@param {OkParseResult<DocumentNode>} parseResult
	*/
	createSourceCode(file, parseResult) {
		return new SomlSourceCode({
			text: /** @type {string} */ (file.body),
			ast: parseResult.ast,
		});
	}
}
