# prefer-block-strings

📝 Prefer block strings for strings of three lines or more.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A `"..."` string with many `\n` escapes is hard to read. Canonical form and JSON write strings that way.

This rule reports a `"..."` string of three lines or more, not counting line breaks at the start and end, and the autofix writes it as a block string with the same value: `'''` when it can hold the value as it is, and `"""` otherwise, with escapes for line breaks at the edges, whitespace at the end of a line, and invisible characters. A string that needs `"""` and has `"""` in it is not reported.

## Examples

```soml
# ❌
script: "set -e\nnpm ci\nnpm test"

# ✅
script:
	'''
	set -e
	npm ci
	npm test
	'''
```

```soml
# ❌
certificate: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n"

# ✅
certificate:
	"""
	-----BEGIN CERTIFICATE-----
	MIIB
	-----END CERTIFICATE-----\n
	"""
```

```soml
# ✅
greeting: "Hello,\nAda"
```
