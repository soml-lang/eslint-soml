# Maintaining

## Writing rules

Rules get the tree from [`parseTree()`](https://github.com/soml-lang/soml-javascript#parsetreetext) in `soml`. Its readme lists every node type. The node types are exported as TypeScript types from this package too.

Besides the usual `getText()`, `getLoc()`, `getRange()`, and `getLocFromIndex()`, `context.sourceCode` has `getParent()` and `getAllComments()`, and the token methods `getTokenBefore()`, `getTokenAfter()`, `getFirstToken()`, `getLastToken()`, and `getTokens()`. Each token method takes an `includeComments` option. The methods that return one token return `null` when there is none.
