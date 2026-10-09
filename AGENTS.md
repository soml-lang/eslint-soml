# Agents

This plugin lints [SOML](https://github.com/soml-lang/soml/blob/main/spec.md) documents. It provides the language (`soml/soml`) and the rules.

## Philosophy

Keep rules simple and high-signal. Target real mistakes and real readability problems in config files, and skip rare edge cases rather than complicating a rule.

The parser is strict. Duplicate keys, the case of hex digits, a `+` sign, and many other mistakes are parse errors, so they never reach a rule. Before adding a rule, check that its input parses.

The spec is `../soml/spec.md`. The reference implementation is `../soml-javascript`, published as `soml-lang`. To try a change in it before it is published, `npm link` it here.

## Language

`language/` is the ESLint language: `SomlLanguage` parses a file with `parseTree()` from `soml-lang` and creates a `SomlSourceCode`.

- A parse error is reported with `ParseError#reason`, at a 1-based line and column computed from `ParseError#offset`. ESLint does not adjust a parse error's position by the language's `columnStart`, and `ParseError#column` counts code points rather than UTF-16 code units.
- ESLint removes a BOM before parsing and sets `file.bom`. A BOM is an error in SOML, so `parse()` reports it.
- A carriage return is a parse error, so every document a rule sees uses LF only. Fixes build line breaks with `\n`.

### AST

The tree comes from `parseTree()`, and the `soml-javascript` readme documents every node. In short:

- `Document` has `body` (an `Object` or an `Array`), `tokens`, and `comments`.
- `Object` has `members` and `braced`, which is `false` only for a top-level object without braces. `Member` has `key` and `value`.
- `Array` has `elements`, which are value nodes. Inside `{}` and `[]`, a comma or a line break separates items, so there may be no `,` token between two members or items.
- `Key` has the decoded `value` and a `style` of `'bare'`, `'literal'`, or `'escaped'`.
- `String` has the decoded `value`, a `style` of `'literal'` or `'escaped'`, and `block`. `Integer` has a `bigint` `value` and a `radix`. `Float`, `Boolean`, `Instant` (`Temporal.Instant`), and `Duration` (`Temporal.Duration`) have a `value`. `Null` has none. `Duration` also has `negative` and `parts`, each `{number, unit}` as written. Rules do not read the `value` of an `Instant` or a `Duration`, so they work without `Temporal`. Use `parts` or the source text instead.
- Every node, token, and comment has `range` and `loc`. Comments are `{type: 'Line' | 'Block', value}`, with `value` excluding the delimiters.

Nodes have no `parent` property. Use `context.sourceCode.getParent(node)`, or the `parent` argument of a listener.

## Rule anatomy

Rules export a default config object with `create` and `meta`. The `create` function uses `context.on(NodeType, listener)` to register visitors (this is a custom API, not standard ESLint). See the [ESLint custom rules guide](https://eslint.org/docs/latest/extend/custom-rules) for the underlying API.

Key differences from standard ESLint:

- Use `context.on('NodeType', listener)` instead of returning a visitor object. It also takes an array of node types.
- Listeners return or yield problem objects (`{node, messageId, fix, suggest, data}`) directly. The adapter calls `context.report()` for you.
- Fix functions receive `(fixer, {abort})`. Call `abort()` to bail out of an unfixable case.

```js
const MESSAGE_ID = 'rule-name';

const messages = {
	[MESSAGE_ID]: 'Error message with {{placeholder}}.',
};

/** @param {SomlContext} context */
const create = context => {
	context.on('String', node => {
		return {
			node,
			messageId: MESSAGE_ID,
			data: {placeholder: 'value'},
			fix: fixer => fixer.replaceText(node, 'replacement'),
		};
	});
};

/** @type {SomlRule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce …',
			recommended: true, // 'unopinionated' (catches bugs, in both presets), true (in recommended only), or false (opt-in)
		},
		fixable: 'code', // or omit; add hasSuggestions: true for suggestions
		schema: [],
		defaultOptions: [{option: 'default'}], // merged automatically
		languages: ['soml/soml'],
		messages,
	},
};
export default config;
```

Options are accessed via `context.options[0]`. Use `meta.defaultOptions` for defaults (no manual merging).

### `recommended` config level

`meta.docs.recommended` picks the preset that enables the rule:

- **`'unopinionated'`** - Catches bugs: a document that does not mean what its author intended, such as `mode: 644`, which is a decimal number and not the octal file mode it looks like. In both `unopinionated` and `recommended` (the former is a subset).
- **`true`** - Style, or a bug check that also reports intentional patterns. In `recommended` only.
- **`false`** - Off by default, only in `all`. Only for rules that encode a project choice, such as `sort-keys`. `test/package.js` lists these.

| `recommended` | `unopinionated` | `recommended` config | `all` |
|---|---|---|---|
| `'unopinionated'` | on | on | on |
| `true` | off | on | on |
| `false` (or omitted) | off | off | on |

The preset configs apply to `**/*.soml` files and set `language: 'soml/soml'`.

Name boolean options in the positive `check*` form (for example, `checkKeys`), never the negated `ignore*`/`skip*` form. This does not apply to array or pattern options like `ignore`.

### Helper naming

- `is*`/`has*`/`should*`/`can*`/`needs*` must return booleans. Prefer explicit `false` over `undefined` in predicate helpers.
- `get*Problem` returns one problem object or `undefined`; `get*Problems` returns or yields several.
- Avoid `check*` for private helpers. Reserve `check*` for public boolean options.

## Rule languages

Every rule must declare [`meta.languages`](https://eslint.org/docs/latest/extend/custom-rules#rule-languages) as `['soml/soml']`. `test/package.js` enforces this.

## Reusable utilities

`rules/utils/` holds small helpers for rules. See `rules/utils/index.js`; each one has a doc comment. Import from the barrel (`import {…} from './utils/index.js'`).

When at least two rules need the same non-trivial logic, put it in `rules/utils/` instead of copying it. Keep one-liners and rule-specific helpers local.

Use `soml-lang` for anything about values: `parse()` for decoding, `stringify()` with `{canonical: true}` for canonical form, `stringifyValue()` for the canonical spelling of one value, `parseTree()` for the tree, and `formatEdits()` for the formatter's changes. Do not write a second decoder for strings or numbers.

## Auto-generated files

- **`rules/index.js`** is auto-generated. Never edit it by hand. Run `npm run create-rules-index-file`.
- **Doc headers** in `docs/rules/<rule>.md` (everything above `<!-- end auto-generated rule header -->`) and the rules table in `readme.md` are generated by `eslint-doc-generator`. Run `npm run fix:eslint-docs`.
- **`test/fixtures/conformance/`** is copied from the conformance suite in the `soml` spec repository. Run `npm run sync-conformance`.

## Documentation

Use JavaScript syntax for configuration examples.

Rule docs use `soml` code blocks. Prefer one failing (`# ❌`) example followed by one corresponding passing (`# ✅`) example in each block. Use separate blocks for distinct cases.

## Autofix

An autofix must keep the value of the document exactly. The snapshot tester checks this for every autofix, by comparing canonical forms. If a fix would change the value, offer a suggestion instead, or only report.

- **Comments** - Fixes must not remove or move comments. If the replaced range holds a comment, do not fix.
- **Generator fixes** - Use `* fix(fixer) { yield ... }` for multi-step fixes.
- **Line breaks** - Documents use LF only, so `\n` is always right.

## Testing

Tests use the Node.js test runner (`node:test`). Prefer `test.snapshot()`, which generates snapshots for errors, fixes, and suggestions. Every test case is parsed as SOML, so it must be a valid document.

```js
import {getTester} from './utils/test.js';
const {test} = getTester(import.meta);

test.snapshot({
	valid: ['name: \'soml\''],
	invalid: ['name: "soml"'],
});
```

- The tests need Node.js 26 or later, because they compare values, which needs `Temporal`.
- **While developing, only run targeted tests**: `node --test test/rule-name.js`.
- **Run the full test suite (`npm test`) once at the end.**
- Update snapshots: `node --test --test-update-snapshots test/rule-name.js`. Snapshots are in `test/snapshots/`.
- Focus a single case: wrap with `test.only('code')` and run `node --test --test-only test/rule-name.js` (remove before committing).

### Edge cases to test

Include test cases for these when relevant to the rule:

- **Quoted keys** - `'a': 1` and `"a": 1`, and a quoted key with a `.`, `'a.b': 1`.
- **Block strings** - `'''` and `"""`, with indentation and longer delimiters.
- **Comments** - Next to and inside the targeted node, to verify fixes do not drop them.
- **Nesting** - The brace-less top level, `{…}`, `[…]`, and a top-level array.
- **Every scalar type** - A rule about one type should ignore the others.

## Linting

CI lints with **ESLint**, not `xo`. Run `npm run fix` (or `npm run fix:js`), which auto-fixes and reports the rest.

Lint enforces single quotes. Don't write backtick strings in test cases unless you need interpolation.

## Rule naming

- **`no-`** - Disallow something: `no-empty-keys`
- **`prefer-`** - Suggest a better alternative: `prefer-literal-strings`
- **No prefix** - Enforce a specific pattern: `format`

Name after the target construct, not the fix.

## Creating a new rule

1. Run `npm run create-rule` to scaffold the rule file, test file, and doc file. This also regenerates `rules/index.js` and the doc headers.
2. Write tests in `test/<rule>.js` before implementing the rule.
3. Implement the rule in `rules/<rule>.js`.
4. Write documentation in `docs/rules/<rule>.md` (below the auto-generated header).
5. Run `node --test test/<rule>.js`, then `npm run lint:js`, then `npm test`.

## Commit message format

- **New rule**: `` Add `rule-name` rule ``
- **Fix/improve existing rule**: `` `rule-name`: Short description ``
- **General fix**: `Fix short description`
- **Add option to rule**: `` `rule-name`: Add `optionName` option ``
- **Drop a rule**: `` Drop `rule-name` rule ``

Always use backticks around rule names and option names in commit messages.
