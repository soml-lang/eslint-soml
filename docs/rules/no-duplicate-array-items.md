# no-duplicate-array-items

📝 Disallow duplicate strings and dates in an array.

🚫 This rule is _disabled_ in the following [configs](https://github.com/soml-lang/eslint-soml#preset-configs): ✅ `recommended`, ☑️ `unopinionated`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Many arrays in a config are sets: hosts, plugins, file patterns, allowed origins, holidays. A repeated item in such an array is usually a copy-paste mistake. This rule reports a string or date that is already in the same array. Strings are compared by their value, so `'a'` and `"a"` are the same. Dates are compared by year, month, and day; a date and a string with the same spelling are distinct.

Only strings and dates are checked, because numbers and other values repeat in data, as in `[0, 0, 1]`. The rule is off by default, because arrays can repeat on purpose, such as command line arguments or dates of separate events.

The suggestion removes the repeated item. It is not an autofix, because it changes the value. There is no suggestion when a comment is next to the item.

## Examples

```soml
# ❌
hosts: ['a.example.com', 'b.example.com', 'a.example.com']

# ✅
hosts: ['a.example.com', 'b.example.com']
```

```soml
# ❌
holidays: [2026-12-25, 2026-12-25]

# ✅
holidays: [2026-12-25]
```
