# prefer-literal-strings

📝 Prefer literal strings, `'…'`, when a string does not need escapes.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

SOML has two kinds of strings. `'...'` is literal, with no escapes, and `"..."` has escapes. The [readme](https://github.com/soml-lang/soml#example) says to use `'` by default, because a Windows path or a regular expression pasted into `'...'` is correct as it is, while in `"..."` every `\` must be doubled.

This rule reports a `"..."` string or key that can be written as `'...'` with the same value, and the autofix rewrites it. A string stays `"..."` when its value has a `'`, a line feed, a tab, a control character, or a character that [`no-invisible-characters`](no-invisible-characters.md) reports, because those need escapes or are clearer escaped. A string whose value is one that [`no-doubled-backslashes-in-literal-strings`](no-doubled-backslashes-in-literal-strings.md) or [`no-escapes-in-literal-strings`](no-escapes-in-literal-strings.md) reports in a literal string, such as `"^\\\\d+$"` or `"Done.\\n"`, stays `"..."` too.

A `"""` block string becomes a `'''` block string only when its text has no `\`, no `'`, and no invisible character, so its layout stays the same. Unlike a single-line string, a block string may hold a tab as it is.

## Examples

```soml
# ❌
name: "soml"

# ✅
name: 'soml'
```

```soml
# ❌
path: "C:\\Users\\sindre"

# ✅
path: 'C:\Users\sindre'
```

```soml
# ✅ These need escapes.
text: "line one\nline two"
quote: "don't"
```
