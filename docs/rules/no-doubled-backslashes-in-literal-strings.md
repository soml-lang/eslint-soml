# no-doubled-backslashes-in-literal-strings

📝 Disallow doubled backslashes in literal strings, such as `'^\\d+$'`.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A literal string, `'...'`, has no escapes, so `\\` in it is two backslashes. In JSON, JavaScript, and Python, a regular expression or a Windows path in a string doubles every backslash, and this often stays when such a string is moved to a literal string. Then a regular expression such as `'\\.pyi?$'` matches a backslash followed by any character, so it matches nothing that was meant.

This rule reports a literal string in which every backslash is doubled, and at least one `\\` comes before `.`, `b`, `d`, `s`, `w`, `D`, `S`, or `W`, as in a regular expression or a Windows path such as `'C:\\Windows\\System32'`. Other Windows paths, such as `'C:\\Users\\me'`, are not reported. A string with a `"` or a `'` is not reported, because it holds code with strings in it, such as JSON text or a script in a block string, which doubles its backslashes on purpose.

The suggestion writes one backslash for each `\\`. To keep two backslashes, as in a regular expression that matches a backslash, use an escaped string: `"\\\\d"`.

## Examples

```soml
# ❌
include: '\\.pyi?$'

# ✅
include: '\.pyi?$'
```

```soml
# ❌
tag-pattern: '^v\\d+\\.\\d+\\.\\d+$'

# ✅
tag-pattern: '^v\d+\.\d+\.\d+$'
```

```soml
# ❌
path: 'C:\\Windows\\System32'

# ✅
path: 'C:\Windows\System32'
```

```soml
# ✅
share: '\\server\share'
```
