# no-block-string-trailing-whitespace

📝 Disallow trailing whitespace in block strings.

💼 This rule is enabled in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The lines of a block string are content, including any spaces or tabs at their end. Many editors remove trailing whitespace when a file is saved, so a value that depends on it can change without anyone seeing it.

A line of only spaces and tabs is not reported, because it becomes an empty line in the value either way.

There is no autofix. In a `"""` block string, write the whitespace as an escape, such as `\t` or `\u{20}`. In a `'''` block string, which has no escapes, use a `"""` block string or a `"..."` string.

## Examples

```soml
# ❌ (two spaces after `foo`)
text:
	'''
	foo  
	'''

# ✅
text:
	"""
	foo\u{20}\u{20}
	"""
```
