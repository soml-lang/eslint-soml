# key-name-casing

📝 Enforce a casing style for keys.

🚫 This rule is _disabled_ in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Enforces one casing style for keys, so a reader does not have to guess whether a setting is `retryAfter` or `retry-after`. The default is kebab-case, which SOML allows without quotes and which its examples use.

Only bare keys are checked. A quoted key usually holds data rather than a name, such as a path or a URL. Digits are allowed in every style, so `http2-port` is kebab-case, and `404` passes in every style. A key that starts with `_` or `-` passes in no style, so add it to `ignore` if you use such keys. There is no autofix, because renaming a key changes the data.

The rule is off by default, because the right casing depends on the program that reads the file.

## Examples

```soml
# ❌
retryAfter: 30s

# ✅
retry-after: 30s
```

```soml
# ✅ Quoted keys are not checked.
'src/index.js': 'entry'
```

## Options

### case

Type: `'kebab-case' | 'camelCase' | 'snake_case' | 'PascalCase'`\
Default: `'kebab-case'`

The casing style keys must use.

### ignore

Type: `string[]`\
Default: `[]`

Regular expressions for keys to ignore. They are compiled with the `v` flag, so a `-` in a class must be escaped, as in `[\w\-]`.

```js
'soml/key-name-casing': [
	'error',
	{
		case: 'camelCase',
		ignore: [
			'^_',
		],
	},
]
```
