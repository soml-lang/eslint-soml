import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findVariable} from '@eslint-community/eslint-utils';
import {isMemberExpression, removeMemberExpressionProperty} from './utils/index.js';

const messageId = path.basename(fileURLToPath(import.meta.url), '.js');

const properties = new Map([
	['range', 'getRange'],
	['loc', 'getLoc'],
]);

/*
Whether a part of the object of a member expression is optional, as in `node?.parent.range`, which gives `undefined` where `getRange(node?.parent)` would throw.
*/
function hasOptionalObject(memberExpression) {
	for (let {object} = memberExpression; object.type === 'MemberExpression' || object.type === 'CallExpression'; object = object.object ?? object.callee) {
		if (object.optional) {
			return true;
		}
	}

	return false;
}

/*
Whether the expression is an assignment target, including a target nested in a destructuring pattern. Computed keys and default values are reads, so the walk follows only the value or left side of those patterns.
*/
function isAssignmentTarget(node) {
	for (let {parent} = node; parent; node = parent, parent = parent.parent) {
		if (['AssignmentExpression', 'ForInStatement', 'ForOfStatement'].includes(parent.type)) {
			return parent.left === node;
		}

		if (!(
			parent.type === 'ArrayPattern'
			|| parent.type === 'ObjectPattern'
			|| (parent.type === 'Property' && parent.parent.type === 'ObjectPattern' && parent.value === node)
			|| (parent.type === 'RestElement' && parent.argument === node)
			|| (parent.type === 'AssignmentPattern' && parent.left === node)
		)) {
			return false;
		}
	}

	return false;
}

/*
Whether a call can take the place of a member expression: it is not assigned to or deleted, and no comment is inside it, which the fix would remove.
*/
function canReplace(memberExpression, sourceCode) {
	const {parent} = memberExpression;

	return !hasOptionalObject(memberExpression)
		&& !isAssignmentTarget(memberExpression)
		&& !(parent.type === 'UpdateExpression' && parent.argument === memberExpression)
		&& !(parent.type === 'UnaryExpression' && parent.operator === 'delete')
		&& sourceCode.getCommentsInside(memberExpression).length === 0;
}

/*
A parameter is initialized before its function body runs. Local bindings are not used for autofixes, rather than trying to infer when they initialize.
*/
function isInitializedParameter(variable, memberExpression) {
	return variable?.defs.some(definition => definition.type === 'Parameter' && definition.node.body.range[0] <= memberExpression.range[0]) ?? false;
}

/*
How the code can reach the source code: a `sourceCode` parameter, or `context.sourceCode` through a `context` parameter, or `undefined` when neither is available.
*/
function getSourceCodeText(scope, memberExpression) {
	if (isInitializedParameter(findVariable(scope, 'sourceCode'), memberExpression)) {
		return 'sourceCode';
	}

	if (isInitializedParameter(findVariable(scope, 'context'), memberExpression)) {
		return 'context.sourceCode';
	}
}

const propertyNames = properties.keys().toArray();

const config = {
	create: context => ({
		MemberExpression(memberExpression) {
			if (!isMemberExpression(memberExpression, {
				properties: propertyNames,
				optional: false,
				computed: false,
			})) {
				return;
			}

			const {name} = memberExpression.property;
			const method = properties.get(name);
			const sourceCodeText = getSourceCodeText(context.sourceCode.getScope(memberExpression), memberExpression);

			context.report({
				node: memberExpression.property,
				messageId,
				data: {
					name,
					replacementFunction: `sourceCode.${method}`,
				},
				fix: sourceCodeText === undefined || !canReplace(memberExpression, context.sourceCode)
					? undefined
					: function * (fixer) {
						yield removeMemberExpressionProperty(fixer, memberExpression, context);
						yield fixer.insertTextBefore(memberExpression, `${sourceCodeText}.${method}(`);
						yield fixer.insertTextAfter(memberExpression, ')');
					},
			});
		},
		ObjectPattern(objectPattern) {
			for (const property of objectPattern.properties) {
				if (!(
					property.type === 'Property'
					&& !property.computed
					&& property.key.type === 'Identifier'
					&& propertyNames.includes(property.key.name)
				)) {
					continue;
				}

				const {name} = property.key;

				context.report({
					node: property.key,
					messageId,
					data: {
						name,
						replacementFunction: `sourceCode.${properties.get(name)}`,
					},
				});
			}
		},
	}),
	meta: {
		fixable: 'code',
		messages: {
			[messageId]: 'Use `{{replacementFunction}}(node)` instead of accessing `node.{{name}}`.',
		},
	},
};

export default config;
