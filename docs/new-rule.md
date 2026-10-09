# Creating a new rule

## Prerequisite

- Make sure the check is not already a parse error. The SOML parser is strict, so many mistakes, such as duplicate keys, never reach a rule.
- [Read the ESLint docs on creating a new rule.](https://eslint.org/docs/latest/extend/custom-rules)
- Look at an existing rule, for example [`prefer-literal-strings`](../rules/prefer-literal-strings.js), for inspiration.

## Tip

The AST comes from `parseTree()` in [`soml-javascript`](https://github.com/soml-lang/soml-javascript#parsetreetext), whose readme lists every node type. To see the tree for a document, run `node --input-type=module -e "import {parseTree} from 'soml-lang'; console.dir(parseTree('a: 1'), {depth: undefined})"`.

## Steps

- Run `npm run create-rule` to create files for the new rule.
- Open “test/{RULE_ID}.js” and [write some tests](./write-tests.md) before implementing the rule.
- Open “rules/{RULE_ID}.js” and implement the rule logic.
- Add the correct [`meta.type`](https://eslint.org/docs/latest/extend/custom-rules#rule-structure) to the rule.
- Open “docs/rules/{RULE_ID}.md” and write some documentation. Explain *why* the rule exists in the opening description, and make clear what is and isn't covered in the examples.
- Run `npm test` to ensure the tests pass.
- Open a pull request with a title in exactly the format `` Add `rule-name` rule ``, for example, `` Add `prefer-bare-keys` rule ``.
- The pull request description should include the issue it fixes, for example, `Fixes #123`.

## Implementation note

1. Name boolean options in the positive `check*` form (for example, `checkKeys`), never the negated `ignore*`/`skip*` form. This keeps option naming consistent across rules.
1. Try your best to provide an autofix if possible.
1. Try to provide a suggestion if an autofix is not possible.
1. Make sure the autofix doesn't change the value of the document. If it would, use a suggestion instead.
1. Make sure the suggestion doesn't cause a syntax error.
1. Fixes must not remove comments. If a fix replaces or removes a range that holds a comment, report without a fix.
