import type {ESLint, Linter} from 'eslint';
import type {LanguageOptions, RuleVisitor} from '@eslint/core';
import type {
	CustomRuleDefinitionType,
	CustomRuleTypeDefinitions,
	CustomRuleVisitorWithExit,
	TextSourceCodeBase,
} from '@eslint/plugin-kit';
import type {
	Node,
	DocumentNode,
	ObjectNode,
	MemberNode,
	ArrayNode,
	KeyNode,
	StringNode,
	IntegerNode,
	FloatNode,
	BooleanNode,
	NullNode,
	InstantNode,
	DurationNode,
	Token,
	Comment,
} from 'soml-lang';

export type {
	Node,
	DocumentNode,
	ObjectNode,
	MemberNode,
	ArrayNode,
	KeyNode,
	ValueNode,
	StringNode,
	IntegerNode,
	FloatNode,
	BooleanNode,
	NullNode,
	InstantNode,
	DurationNode,
	DurationPart,
	Token,
	Comment,
	Position,
	SourceLocation,
} from 'soml-lang';

/**
A node, a token, or a comment of a SOML document.
*/
export type SomlSyntaxElement = Node | Token | Comment;

type TokenOptions = {
	/**
	Whether comments count as tokens.

	@default false
	*/
	readonly includeComments?: boolean;
};

type TokenOptionsWithoutComments = TokenOptions & {readonly includeComments?: false};
type TokenOptionsWithComments = TokenOptions & {readonly includeComments: true};

/**
The source code of a SOML document, which a rule gets as `context.sourceCode`.

It has the methods of `TextSourceCodeBase` from `@eslint/plugin-kit`, such as `getText()`, `getLoc()`, `getRange()`, and `getLocFromIndex()`, and the methods below. Token methods find tokens in source order and take only the `includeComments` option. Single-token methods return `null` when there is no token; `getTokens()` returns an array.

@example
```
import type {SomlRuleDefinition} from 'eslint-soml';

const rule: SomlRuleDefinition = {
	meta: {
		type: 'problem',
		messages: {
			trailingComma: 'Remove the comma after the last item.',
		},
	},
	create(context) {
		return {
			Array(node) {
				const lastToken = context.sourceCode.getLastToken(node);
				const beforeLast = lastToken && context.sourceCode.getTokenBefore(lastToken);

				if (beforeLast?.value === ',') {
					context.report({loc: beforeLast.loc, messageId: 'trailingComma'});
				}
			},
		};
	},
};
```
*/
export interface SomlSourceCode extends TextSourceCodeBase<{
	LangOptions: LanguageOptions;
	RootNode: DocumentNode;
	SyntaxElementWithLoc: SomlSyntaxElement;
	ConfigNode: Comment;
}> {
	/**
	Marks the source code as SOML, so a rule that works on several languages can tell, as with `context.sourceCode.parserServices?.isSOML`.
	*/
	readonly parserServices: {readonly isSOML: true};

	/**
	The parent of a node, or `undefined` for the `Document` node. Nodes have no `parent` property.
	*/
	getParent(node: Node): Node | undefined;

	/**
	Every ancestor node, from the root to the parent. Tokens and comments have no ancestors.

	@example
	```
	const parents = context.sourceCode.getAncestors(node).map(ancestor => context.sourceCode.getParent(ancestor));
	```
	*/
	getAncestors(node: SomlSyntaxElement): Node[];

	/**
	Every comment, in source order.
	*/
	getAllComments(): readonly Comment[];

	/**
	The token before a node, token, or comment.
	*/
	getTokenBefore(nodeOrToken: SomlSyntaxElement, options?: TokenOptionsWithoutComments): Token | null;
	getTokenBefore(nodeOrToken: SomlSyntaxElement, options: TokenOptionsWithComments): Token | Comment | null;
	getTokenBefore(nodeOrToken: SomlSyntaxElement, options?: TokenOptions): Token | Comment | null;

	/**
	The token after a node, token, or comment.
	*/
	getTokenAfter(nodeOrToken: SomlSyntaxElement, options?: TokenOptionsWithoutComments): Token | null;
	getTokenAfter(nodeOrToken: SomlSyntaxElement, options: TokenOptionsWithComments): Token | Comment | null;
	getTokenAfter(nodeOrToken: SomlSyntaxElement, options?: TokenOptions): Token | Comment | null;

	/**
	The first token inside a node.
	*/
	getFirstToken(node: Node, options?: TokenOptionsWithoutComments): Token | null;
	getFirstToken(node: Node, options: TokenOptionsWithComments): Token | Comment | null;
	getFirstToken(node: Node, options?: TokenOptions): Token | Comment | null;

	/**
	The last token inside a node.
	*/
	getLastToken(node: Node, options?: TokenOptionsWithoutComments): Token | null;
	getLastToken(node: Node, options: TokenOptionsWithComments): Token | Comment | null;
	getLastToken(node: Node, options?: TokenOptions): Token | Comment | null;

	/**
	Every token inside a node, in source order.
	*/
	getTokens(node: Node, options?: TokenOptionsWithoutComments): Token[];
	getTokens(node: Node, options: TokenOptionsWithComments): Array<Token | Comment>;
	getTokens(node: Node, options?: TokenOptions): Array<Token | Comment>;
}

type ValueParent = MemberNode | ArrayNode;
type CollectionParent = DocumentNode | ValueParent;

/**
The listeners that a rule for SOML returns, with the type of each node and of its parent.
*/
export interface SomlRuleVisitor extends RuleVisitor, CustomRuleVisitorWithExit<{
	Document?(node: DocumentNode, parent: undefined): void;
	Object?(node: ObjectNode, parent: CollectionParent): void;
	Member?(node: MemberNode, parent: ObjectNode): void;
	Key?(node: KeyNode, parent: MemberNode): void;
	Array?(node: ArrayNode, parent: CollectionParent): void;
	String?(node: StringNode, parent: ValueParent): void;
	Integer?(node: IntegerNode, parent: ValueParent): void;
	Float?(node: FloatNode, parent: ValueParent): void;
	Boolean?(node: BooleanNode, parent: ValueParent): void;
	Null?(node: NullNode, parent: ValueParent): void;
	Instant?(node: InstantNode, parent: ValueParent): void;
	Duration?(node: DurationNode, parent: ValueParent): void;
}> {}

export type SomlRuleDefinitionTypeOptions = CustomRuleTypeDefinitions;

/**
The type of a rule for SOML files, which gets a `SomlSourceCode` and returns a `SomlRuleVisitor`.

@example
```
import type {SomlRuleDefinition} from 'eslint-soml';

const rule: SomlRuleDefinition = {
	meta: {
		type: 'suggestion',
		messages: {
			tooLong: 'The key `{{key}}` is longer than 40 characters.',
		},
	},
	create(context) {
		return {
			Key(node) {
				if (node.value.length > 40) {
					context.report({node, messageId: 'tooLong', data: {key: node.value}});
				}
			},
		};
	},
};
```
*/
export type SomlRuleDefinition<Options extends Partial<SomlRuleDefinitionTypeOptions> = {}> = CustomRuleDefinitionType<{
	LangOptions: LanguageOptions;
	Code: SomlSourceCode;
	Visitor: SomlRuleVisitor;
	Node: SomlSyntaxElement;
}, Options>;

/**
The `context` of a rule for SOML files, for a helper that a rule passes it to.

@example
```
import type {SomlRuleContext, StringNode} from 'eslint-soml';

function isWrittenEscaped(context: SomlRuleContext, node: StringNode): boolean {
	return context.sourceCode.getText(node).startsWith('"');
}
```
*/
export type SomlRuleContext<Options extends Partial<SomlRuleDefinitionTypeOptions> = {}> = Parameters<SomlRuleDefinition<Options>['create']>[0];

declare const eslintSoml: ESLint.Plugin & {
	configs: {
		recommended: Linter.Config;
		unopinionated: Linter.Config;
		all: Linter.Config;
	};
};

export default eslintSoml;
