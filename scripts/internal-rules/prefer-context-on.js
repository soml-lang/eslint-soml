import path from 'node:path';
import {fileURLToPath} from 'node:url';

const messageId = path.basename(fileURLToPath(import.meta.url), '.js');

function isRuleCreate(functionNode) {
	return (
		functionNode.params.length < 2
		&& (
			(functionNode.id?.name === 'create')
			|| (
				functionNode.parent.type === 'VariableDeclarator'
				&& functionNode.parent.init === functionNode
				&& functionNode.parent.id.type === 'Identifier'
				&& functionNode.parent.id.name === 'create'
				&& functionNode.parent.parent.type === 'VariableDeclaration'
				&& functionNode.parent.parent.kind === 'const'
				&& functionNode.parent.parent.declarations.length === 1
				&& functionNode.parent.parent.declarations[0] === functionNode.parent
			)
			|| (
				functionNode.parent.type === 'Property'
				&& functionNode.parent.value === functionNode
				&& functionNode.parent.key.type === 'Identifier'
				&& functionNode.parent.key.name === 'create'
			)
		)
	);
}

const isContextOnCall = node => node.type === 'CallExpression'
	&& node.callee.type === 'MemberExpression'
	&& node.callee.object.type === 'Identifier'
	&& node.callee.object.name === 'context'
	&& !node.callee.computed
	&& node.callee.property.name === 'on';

/*
Migration is report-only. Registering entries separately can change the override semantics of repeated or computed keys, spreads, shorthands, getters, and setters. Manual conversion also preserves conditional returns, the context binding, method semantics, and comments before listeners, between keys and values, and around the object and its parentheses without losing or copying them.
*/
function check(context, functionNode, listeners) {
	// Returning `context.on(…)` adds a listener and returns nothing.
	if (!isRuleCreate(functionNode) || isContextOnCall(listeners)) {
		return;
	}

	context.report({
		node: listeners,
		messageId,
	});
}

const config = {
	create: context => ({
		ArrowFunctionExpression(functionNode) {
			if (functionNode.body.type !== 'BlockStatement') {
				check(context, functionNode, functionNode.body);
			}
		},
		'ReturnStatement'(returnStatement) {
			if (!returnStatement.argument) {
				return;
			}

			const scope = context.sourceCode.getScope(returnStatement).variableScope;
			const functionNode = scope.block;
			check(context, functionNode, returnStatement.argument);
		},
	}),
	meta: {
		messages: {
			[messageId]: 'Use `context.on()` instead of return listeners.',
		},
	},
};

export default config;
