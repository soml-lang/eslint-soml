import path from 'node:path';
import {fileURLToPath} from 'node:url';

const messageIdError = path.basename(fileURLToPath(import.meta.url), '.js');
const suggestionDestructuringInParameter = 'suggestion/destructuring-in-parameter';

const config = {
	create: context => ({
		':function'(functionNode) {
			for (const parameter of functionNode.params) {
				const identifier = parameter.type === 'AssignmentPattern' ? parameter.left : parameter;
				if (identifier.type !== 'Identifier' || identifier.name !== 'sourceCode') {
					continue;
				}

				// A function with destructured parameters cannot have its own `use strict` directive.
				const hasUseStrictDirective = functionNode.body.type === 'BlockStatement'
					&& functionNode.body.body.some(statement => statement.directive === 'use strict');

				// Destructure the parameter rather than renaming it to `context`, which could clash with another binding or change a default parameter's scope.
				context.report({
					node: identifier,
					messageId: messageIdError,
					suggest: !hasUseStrictDirective && parameter.type === 'Identifier'
						? [{
							messageId: suggestionDestructuringInParameter,
							fix(fixer) {
								// A shorthand property keeps the existing `sourceCode` binding and all its references.
								// The function body, including any parentheses around it, stays unchanged.
								const requiresParentheses = functionNode.type === 'ArrowFunctionExpression'
									&& context.sourceCode.getTokenAfter(parameter).value === '=>';
								// An arrow function with one parameter may have no parentheses, which a pattern needs.
								return fixer.replaceText(parameter, requiresParentheses ? '({sourceCode})' : '{sourceCode}');
							},
						}]
						: [],
				});
			}
		},
	}),
	meta: {
		fixable: 'code',
		hasSuggestions: true,
		messages: {
			[messageIdError]: 'Accept `context` instead of `sourceCode` in utilities.',
			[suggestionDestructuringInParameter]: 'Change parameter to `{sourceCode}`.',
		},
	},
};

export default config;
