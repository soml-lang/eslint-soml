/**
@import {Token, Comment} from 'soml-lang';
*/

/**
Whether a token from `sourceCode` is a comment.

@param {Token | Comment | null} token
@returns {boolean}
*/
export function isComment(token) {
	return token?.type === 'Line' || token?.type === 'Block';
}

/**
Whether a token is the punctuator `value`, such as `,` or `]`. A comment or a string with that text is not.

@param {Token | Comment | null} token
@param {string} value
@returns {boolean}
*/
export function isPunctuator(token, value) {
	return token?.type === 'Punctuator' && token.value === value;
}
