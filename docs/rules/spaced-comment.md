# spaced-comment

📝 Require a space after `#` and `/*`, and before `*/`.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A space after `#` or `/*`, and before `*/`, makes a comment easier to read.

The rule allows an empty comment, more `#` at the start of a line comment (`## Section`), more `*` at the start or end of a block comment (`/** Note */`), and any whitespace, such as a line break. The space then goes after those markers, so `##Section` is reported.

A line comment that is only a hex color, such as `#ff0000`, is not reported, also when another comment follows it, as in `#ff0000 # red`. It is almost always a color in an array that `#` turned into a comment, so the array has no item there. Adding a space would hide that mistake. Quote the color instead: `'#ff0000'`.

## Examples

```soml
# ❌
#Comment
name: 'soml'

# ✅
# Comment
name: 'soml'
```

```soml
# ❌
/*Comment*/
name: 'soml'

# ✅
/* Comment */
name: 'soml'
```

```soml
# ✅
## Section
name: 'soml'
```
