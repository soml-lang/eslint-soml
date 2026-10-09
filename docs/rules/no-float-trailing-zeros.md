# no-float-trailing-zeros

📝 Disallow trailing zeros in the fraction of a float.

💼🚫 This rule is enabled in the ✅ `recommended` [config](https://github.com/soml-lang/eslint-soml#preset-configs). This rule is _disabled_ in the ☑️ `unopinionated` [config](https://github.com/soml-lang/eslint-soml#preset-configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A float has no trailing zeros, so `3.10` is the same value as `3.1`. That is a problem when the number is a version or a label: [`python: [3.9, 3.10]`](https://hugovk.dev/blog/2021/the-python-3-1-problem/) asks for Python 3.1. The same mistake is common in YAML.

This rule reports a float whose fraction has two or more digits and ends in `0`. `1.0` is fine, because one `0` is how a float is written. There are two suggestions: write it as a string, for a version or a label, or remove the zeros, for a number. Neither is an autofix, because only the author knows which one is meant.

## Examples

```soml
# ❌
python: [3.9, 3.10]

# ✅
python: ['3.9', '3.10']
```

```soml
# ❌
ratio: 1.50

# ✅
ratio: 1.5
```
