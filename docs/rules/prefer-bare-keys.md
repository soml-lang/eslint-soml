# prefer-bare-keys

📝 Prefer bare keys when a key does not need quotes.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A key made of ASCII letters, digits, `_`, and `-` needs no quotes. That includes keys that look like numbers or keywords, such as `404` and `true`, because in SOML a key is always a string.

This rule reports quotes around such a key, and the autofix removes them. A key with a space, a `.`, or any other character keeps its quotes, because it needs them: `'a.b'` is a key, while `a.b` is a parse error.

## Examples

```soml
# ❌
'name': 'soml'

# ✅
name: 'soml'
```

```soml
# ❌
"404": 'Not found'

# ✅
404: 'Not found'
```

```soml
# ✅ These need quotes.
'the name': 'x'
'a.b': 'x'
```
