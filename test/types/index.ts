import type {Linter} from 'eslint';
import eslintSoml, {
	type Comment,
	type DocumentNode,
	type MemberNode,
	type Node,
	type SomlRuleContext,
	type SomlRuleDefinition,
	type SomlSourceCode,
	type StringNode,
	type Token,
	type ValueNode,
} from '../../index.js';

const config: Linter.Config = eslintSoml.configs.recommended;
const configs: Linter.Config[] = [config, eslintSoml.configs.unopinionated, eslintSoml.configs.all];

function getFirstValue(document: DocumentNode): ValueNode | undefined {
	return document.body.type === 'Object' ? document.body.members[0]?.value : document.body.elements[0];
}

export {configs, getFirstValue};

// A rule for SOML files, with typed nodes, parents, tokens, and options.
const keyLength: SomlRuleDefinition<{RuleOptions: [{maximum: number}]; MessageIds: 'tooLong'}> = {
	meta: {
		type: 'suggestion',
		schema: [{type: 'object', properties: {maximum: {type: 'integer'}}}],
		defaultOptions: [{maximum: 40}],
		messages: {
			tooLong: 'The key `{{key}}` is longer than {{maximum}} characters.',
		},
	},
	create(context) {
		const [{maximum}] = context.options;
		const isSoml: true = context.sourceCode.parserServices.isSOML;

		return {
			Key(node, parent) {
				const member: MemberNode = parent;
				const colon: Token | null = context.sourceCode.getTokenAfter(node);
				const withComments: Token | Comment | null = context.sourceCode.getTokenAfter(member.value, {includeComments: true});

				if (isSoml && node.value.length > maximum && colon !== null && withComments !== undefined) {
					context.report({node, messageId: 'tooLong', data: {key: node.value, maximum: String(maximum)}});
				}
			},
			Integer(node) {
				const value: bigint = node.value;
				void value;
			},
		};
	},
};

export {keyLength};

// A helper that a rule passes its context to.
function isWrittenEscaped(context: SomlRuleContext, node: StringNode): boolean {
	return context.sourceCode.getText(node).startsWith('"');
}

const escapedStrings: SomlRuleDefinition = {
	meta: {messages: {escaped: 'Escaped.'}},
	create(context) {
		return {
			String(node) {
				if (isWrittenEscaped(context, node)) {
					context.report({node, messageId: 'escaped'});
				}
			},
		};
	},
};

export {escapedStrings};

// A shared visitor can inspect the parent of any node, including the root.
const visit = (node: Node, parent: Node | undefined): void => {
	void node;
	void parent;
};

const rootVisitors: SomlRuleDefinition = {
	create() {
		return {
			Document: visit,
			'Document:exit'(node, parent) {
				const document: DocumentNode = node;
				const rootParent: undefined = parent;
				visit(document, rootParent);
			},
			Object: visit,
		};
	},
};

export {rootVisitors};

// Ancestors are nodes, so a helper can pass them to node-only APIs.
function getAncestorParents(sourceCode: SomlSourceCode, node: Node): Array<Node | undefined> {
	return sourceCode.getAncestors(node).map(ancestor => sourceCode.getParent(ancestor));
}

export {getAncestorParents};
