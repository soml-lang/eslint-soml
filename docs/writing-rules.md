# Writing rules

A rule for SOML files gets the syntax tree of [`soml-lang`](https://github.com/soml-lang/soml-javascript#parsetreetext), which documents every node. This package exports the types of the nodes, and `SomlRuleDefinition`, `SomlRuleVisitor`, `SomlSourceCode`, and `SomlRuleContext` (for a helper that a rule passes its `context` to) for a rule:

```js
/**
@type {import('eslint-soml').SomlRuleDefinition}
*/
const rule = {
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

The nodes hold decoded values, and the source text keeps the spelling:

- `Key` and `String` have the decoded `value`, so `a`, `'a'`, and `"\u{61}"` all have the value `a`. Their `style` is how they are written: `'bare'` (a key only), `'literal'` for `'…'`, or `'escaped'` for `"…"`. A `String` also has `block`, which is `true` for `'''` and `"""`.
- `Integer` has a `bigint` `value` and its `radix`, so `0xFF` and `255` have the same value. `Float` and `Boolean` have a `value`, and `Null` has none.
- `context.sourceCode.getText(node)` gives the source text, such as `0xFF` or `"\u{61}"`, for a rule about spelling.

`context.sourceCode` has the methods of `TextSourceCodeBase` from `@eslint/plugin-kit`, such as `getText()`, `getLoc()`, `getRange()`, and `getLocFromIndex()`, and these:

- `getParent(node)` returns the parent of a node, or `undefined` for the `Document` node. Nodes have no `parent` property. A listener also gets the parent as its second argument.
- `getAllComments()` returns every comment, in source order.
- `getTokenBefore()`, `getTokenAfter()`, `getFirstToken()`, `getLastToken()`, and `getTokens()` find tokens in source order and take only the `includeComments` option. Single-token methods return `null` when there is no token; `getTokens()` returns an array.
- `parserServices.isSOML` is `true`, so a rule that works on several languages can tell a SOML file, with `context.sourceCode.parserServices?.isSOML`.

Reading the `value` of an `Instant` or a `Duration` node needs `Temporal`, and so does spreading such a node. Check the type of a node before you read its `value`, and use `parts` or the source text of a duration when you can.
