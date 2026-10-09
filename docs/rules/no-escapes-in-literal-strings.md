# no-escapes-in-literal-strings

📝 Disallow escapes in literal strings, such as `'Line one\nLine two'`.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A literal string, `'...'`, has no escapes, so `'Line one\nLine two'` holds a backslash and an `n`, not a line break. In JavaScript and Python, `'...'` reads escapes, so this is an easy mistake.

This rule reports a `\u{…}`, and a `\n` or `\t` in a value with whitespace or with no letter or digit after it, as in `'Done.\n'`. It does not report a string with a backslash that is not a SOML escape, such as a regular expression with `\d`, a string with a `"`, which is code that keeps its escapes, or a Windows path, such as `'C:\new\temp'` or `'src\test'`. Keys and block strings are not checked.

A path with a space that does not start with a drive, `\\`, `.\`, or `..\`, such as `'Program Files\nodejs'`, is reported, because it looks like text. The suggestion makes `\n` a line break, so check it before you use it.

The suggestion writes the string with the escapes read. It is not an autofix, because it changes the value.

## Examples

```soml
# ❌
message: 'Line one\nLine two'

# ✅
message: "Line one\nLine two"
```

```soml
# ❌
name: 'caf\u{e9}'

# ✅
name: 'café'
```

```soml
# ✅ A regular expression and a path.
pattern: '^\d+\n$'
dir: 'C:\new\temp'
```
