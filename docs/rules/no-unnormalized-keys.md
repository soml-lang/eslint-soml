# no-unnormalized-keys

📝 Disallow keys that are not in a Unicode normalization form.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

SOML never normalizes keys. A key with `é` written as one character (U+00E9) and a key with `e` followed by a combining accent (U+0065 U+0301) look the same, but they are two different keys. This rule requires every key to be in one [Unicode normalization form](https://unicode.org/reports/tr15/), NFC by default, so two keys that look the same are the same.

There is no autofix, because changing a key changes the data.

## Examples

```soml
# ❌ (`e` followed by U+0301 COMBINING ACUTE ACCENT)
'café': 'open'

# ✅ (`é` as one character)
'café': 'open'
```

```soml
# ❌
"cafe\u{301}": 'open'

# ✅
"caf\u{e9}": 'open'
```

## Options

### form

Type: `'NFC' | 'NFD' | 'NFKC' | 'NFKD'`\
Default: `'NFC'`

The normalization form keys must be in.

```js
'soml/no-unnormalized-keys': [
	'error',
	{
		form: 'NFD',
	},
]
```
