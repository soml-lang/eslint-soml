# no-empty-keys

📝 Disallow empty and whitespace-only keys.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

An empty key, `''`, is valid SOML, but it is almost always a mistake: a key that was never filled in. Most programs that read a config cannot look up an empty key in a useful way. A key of only whitespace, such as `' '`, is reported too, because it looks empty.

## Examples

```soml
# ❌
'': 'value'

# ✅
name: 'value'
```

```soml
# ❌
' ': 'value'

# ✅
name: 'value'
```

```soml
# ❌
logging: {'': 'info'}

# ✅
logging: {level: 'info'}
```
