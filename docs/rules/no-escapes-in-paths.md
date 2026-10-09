# no-escapes-in-paths

📝 Disallow `\n` and `\t` escapes in Windows paths.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

In a `"..."` string, `\n` is a line break and `\t` is a tab. So a Windows path written as `"C:\new\temp"` holds a line break and a tab instead of two backslashes, and nothing reports it, because both escapes are valid. Every other mistyped backslash, such as `"C:\Users"`, is already a parse error. This is the trap that literal strings, `'...'`, avoid: a path in `'...'` is correct as it is.

This rule reports a `"..."` string that starts with a Windows drive, such as `C:\`, and holds a `\n` or `\t` escape followed by a letter or a digit, the start of a folder or file name. The suggestion writes the path as it was meant, as a literal string when it can. It is not an autofix, because it changes the value. There is no suggestion when the string also holds a `\n` or `\t` that no name follows, which is likely meant, or a real tab or line feed, because that would need an escape again.

Only a string that starts with a drive in uppercase is checked, because text such as `"Step A:\nDo it"` looks the same as a path in the middle of a string. So a path inside a command, a path with a lowercase drive, and a network path such as `\\server\share` are not checked.

## Examples

```soml
# ❌
dir: "C:\new\temp"

# ✅
dir: 'C:\new\temp'
```

```soml
# ❌
dir: "D:\\Users\temp"

# ✅
dir: 'D:\Users\temp'
```
