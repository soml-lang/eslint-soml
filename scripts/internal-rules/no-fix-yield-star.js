import path from 'node:path';
import {fileURLToPath} from 'node:url';

const messageId = path.basename(fileURLToPath(import.meta.url), '.js');

const config = {
	create(context) {
		const {sourceCode} = context;

		return {
			YieldExpression(yieldExpression) {
				// When the value is used, `yield*` gives the return value of the delegate, which `yield` would not.
				if (!yieldExpression.delegate || yieldExpression.parent.type !== 'ExpressionStatement') {
					return;
				}

				const scope = sourceCode.getScope(yieldExpression).variableScope;
				const functionNode = scope.block;
				if (functionNode.params.every(node => !(node.type === 'Identifier' && node.name === 'fixer'))) {
					return;
				}

				const starToken = sourceCode.getFirstToken(yieldExpression, {skip: 1});
				const [start, end] = sourceCode.getRange(starToken);
				// Only autofix array literals. Other iterables may throw during iteration, which must stay inside the generator's error handling.
				// Removing the star across a line terminator can make `yield` return no value, including inside a comment.
				const canFix = yieldExpression.argument.type === 'ArrayExpression'
					&& !/[\n\r\u{2028}\u{2029}]/v.test(sourceCode.text.slice(end, sourceCode.getRange(yieldExpression.argument)[0]));

				context.report({
					node: starToken,
					messageId,
					// The star and the spaces around it become one space, so `yield * x` and `yield*x` both become `yield x`.
					fix: canFix
						? fixer => fixer.replaceTextRange([
							start - (sourceCode.text[start - 1] === ' ' ? 1 : 0),
							end + (sourceCode.text[end] === ' ' ? 1 : 0),
						], ' ')
						: undefined,
				});
			},
		};
	},
	meta: {
		fixable: 'code',
		messages: {
			[messageId]: 'Unnecessary to delegate fixes',
		},
	},
};

export default config;
