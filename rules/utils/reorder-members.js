import {isComment, isPunctuator} from './token.js';

/**
@import {SomlContext} from '../rule/soml-context.js';
@import {MemberNode, ValueNode} from 'soml-lang';
*/

/**
Whether a comment is directly before a member or an array item, or directly after it or its comma. Moving or removing the node would leave that comment next to the wrong one.

@param {SomlContext} context
@param {MemberNode | ValueNode} node
@returns {boolean}
*/
export function hasAdjacentComment(context, node) {
	const {sourceCode} = context;
	let after = sourceCode.getTokenAfter(node, {includeComments: true});

	if (isPunctuator(after, ',')) {
		after = sourceCode.getTokenAfter(after, {includeComments: true});
	}

	return isComment(sourceCode.getTokenBefore(node, {includeComments: true})) || isComment(after);
}

/**
A fix that puts `members` in the order of `ordered`, by replacing the text of each member with the text of the member that belongs there. The separators stay where they are. Object members have no order in SOML, so this keeps the value.

It aborts when a comment is next to any member or inside a moved member, so comments stay where they are.

@param {SomlContext} context
@param {readonly MemberNode[]} members The members in source order.
@param {readonly MemberNode[]} ordered The same members, in the wanted order.
*/
export function reorderMembers(context, members, ordered) {
	return function * (fixer, {abort}) {
		if (members.some(member => hasAdjacentComment(context, member))) {
			abort();
		}

		for (const [index, member] of members.entries()) {
			if (ordered[index] === member) {
				continue;
			}

			if (context.sourceCode.getTokens(member, {includeComments: true}).some(token => isComment(token))) {
				abort();
			}

			yield fixer.replaceText(member, context.sourceCode.getText(ordered[index]));
		}
	};
}
