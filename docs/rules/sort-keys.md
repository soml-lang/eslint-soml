# sort-keys

📝 Require object keys to be sorted.

🚫 This rule is _disabled_ in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Requires the keys of each object to be sorted, so a key is easy to find in a long file. It is off by default, because the order of a config is often chosen to be read top to bottom.

The rule compares the decoded keys, so `'a'` and `a` sort the same. By default, keys are compared by code point, the order canonical form uses, so a sorted object is in canonical order.

It has the same options as [`@eslint/json`'s `sort-keys`](https://github.com/eslint/json/blob/main/docs/rules/sort-keys.md).

Autofix sorts the whole object in one pass and preserves its value. It leaves the object unchanged if a comment is next to any member or inside a member that would move, including a comment before the first member.

A disable directive for this rule or every rule prevents autofixes anywhere in the file, so disabled members stay in place. This also applies with `noInlineConfig`.

## Examples

```soml
# ❌
name: 'soml'
license: 'MIT'

# ✅
license: 'MIT'
name: 'soml'
```

```soml
# ❌
pool: {min: 2, max: 16}

# ✅
pool: {max: 16, min: 2}
```

## Options

### direction

Type: `'asc' | 'desc'`\
Default: `'asc'`

The first option is the sort direction.

### caseSensitive

Type: `boolean`\
Default: `true`

Whether uppercase and lowercase letters are sorted apart. With `true`, uppercase letters sort before lowercase ones.

### natural

Type: `boolean`\
Default: `false`

Whether numbers in keys are sorted by their value, so `a2` comes before `a10`, and `a9` before `a010`. Everything else is still compared by code point.

### minKeys

Type: `integer`\
Default: `2`

The number of keys from which an object must be sorted.

### allowLineSeparatedGroups

Type: `boolean`\
Default: `false`

Whether a blank line starts a new group, which is sorted on its own.

```js
'soml/sort-keys': [
	'error',
	'asc',
	{
		natural: true,
		allowLineSeparatedGroups: true,
	},
]
```
